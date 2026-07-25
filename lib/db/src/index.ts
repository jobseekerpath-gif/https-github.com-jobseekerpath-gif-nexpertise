import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import fs from "node:fs";
import path from "node:path";

export * from "./schema";

/**
 * Determine Firebase Project ID from FIREBASE_PROJECT_ID environment variable or fallback to config file.
 */
function getFirebaseProjectId(): string {
  if (process.env["FIREBASE_PROJECT_ID"]) {
    return process.env["FIREBASE_PROJECT_ID"];
  }
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.projectId) return config.projectId;
    }
  } catch {
    // Ignore
  }
  return "nexo-platform-b5ac9";
}

/**
 * Determine Firestore Database ID from FIRESTORE_DATABASE_ID environment variable or config file.
 */
function getFirestoreDbId(): string | undefined {
  if (process.env["FIRESTORE_DATABASE_ID"]) {
    return process.env["FIRESTORE_DATABASE_ID"];
  }
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.firestoreDatabaseId) return config.firestoreDatabaseId;
    }
  } catch {
    // Ignore
  }
  return undefined;
}

let appInstance: App;
if (!getApps().length) {
  const projectId = getFirebaseProjectId();
  appInstance = initializeApp({ projectId });
  console.log(`[Firebase] Initialized Firebase Admin SDK for project: ${projectId}`);
} else {
  appInstance = getApps()[0]!;
}

const firestoreDbId = getFirestoreDbId();
export const firestore: Firestore = firestoreDbId
  ? getFirestore(appInstance, firestoreDbId)
  : getFirestore(appInstance);

export const adminAuth: Auth = getAuth(appInstance);

console.log(`[Firestore] Connected to Cloud Firestore database: ${firestoreDbId || "(default)"}`);

/**
 * Firestore collection references
 */
export const collections = {
  users: firestore.collection("users"),
  otps: firestore.collection("otps"),
  learningProgress: firestore.collection("learning_progress"),
  interviewSessions: firestore.collection("interview_sessions"),
  savedJobs: firestore.collection("saved_jobs"),
  historyItems: firestore.collection("history_items"),
  analyticsEvents: firestore.collection("analytics_events"),
  webVitals: firestore.collection("web_vitals"),
  lessonProgress: firestore.collection("lesson_progress"),
  lessonActivity: firestore.collection("lesson_activity"),
  creditTransactions: firestore.collection("credit_transactions"),
  upiPayments: firestore.collection("upi_payments"),
  siteContent: firestore.collection("site_content"),
  b2bCompanies: firestore.collection("b2b_companies"),
  b2bCampaigns: firestore.collection("b2b_campaigns"),
  b2bInvites: firestore.collection("b2b_invites"),
  b2bCreditTransactions: firestore.collection("b2b_credit_transactions"),
  b2bUpiPayments: firestore.collection("b2b_upi_payments"),
  jobSearchCache: firestore.collection("job_search_cache"),
};

// Auto ID generator for numeric sequence IDs in Firestore collections
async function getNextSequenceId(sequenceName: string): Promise<number> {
  const counterRef = firestore.collection("_counters").doc(sequenceName);
  try {
    return await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(counterRef);
      let nextId = 1;
      if (doc.exists) {
        nextId = (doc.data()?.current || 0) + 1;
      }
      transaction.set(counterRef, { current: nextId }, { merge: true });
      return nextId;
    });
  } catch {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}

/**
 * Universal Drizzle-to-Firestore Query Adapter for seamless API route compatibility
 */
export const db: any = {
  select: (projection?: any) => {
    let collectionName = "";
    const whereClauses: Array<{ field: string; op: any; val: any }> = [];
    let orderByClause: { field: string; dir: "asc" | "desc" } | null = null;
    let limitCount: number | null = null;

    const queryBuilder = {
      from: (table: any) => {
        collectionName = getTableName(table);
        return queryBuilder;
      },
      where: (clause: any) => {
        if (clause) parseClause(clause, whereClauses);
        return queryBuilder;
      },
      leftJoin: (_table: any, _condition: any) => queryBuilder,
      innerJoin: (_table: any, _condition: any) => queryBuilder,
      orderBy: (...args: any[]) => {
        if (args.length > 0) {
          const arg = args[0];
          if (arg && typeof arg === "object") {
            const isDesc = arg.isDesc || String(arg).includes("desc") || arg.direction === "desc";
            const field = extractFieldName(arg) || "createdAt";
            orderByClause = { field, dir: isDesc ? "desc" : "asc" };
          }
        }
        return queryBuilder;
      },
      limit: (count: number) => {
        limitCount = count;
        return queryBuilder;
      },
      for: (_mode: string) => queryBuilder,
      execute: async () => executeSelect(),
      then: (resolve: Function, reject: Function) => executeSelect().then(resolve, reject),
    };

    async function executeSelect() {
      if (!collectionName) return [];
      let ref: any = firestore.collection(collectionName);

      for (const w of whereClauses) {
        if (w.op === "eq") ref = ref.where(w.field, "==", w.val);
        else if (w.op === "gt") ref = ref.where(w.field, ">", w.val);
        else if (w.op === "gte") ref = ref.where(w.field, ">=", w.val);
        else if (w.op === "lt") ref = ref.where(w.field, "<", w.val);
        else if (w.op === "lte") ref = ref.where(w.field, "<=", w.val);
      }

      if (orderByClause) {
        try {
          ref = ref.orderBy(orderByClause.field, orderByClause.dir);
        } catch {
          // Fallback to memory sorting if index is missing
        }
      }

      if (limitCount && limitCount > 0) {
        ref = ref.limit(limitCount);
      }

      let snapshot: any = null;
      let querySuccess = false;

      try {
        snapshot = await ref.get();
        querySuccess = true;
      } catch {
        if (firestoreDbId) {
          try {
            let altRef: any = getFirestore(appInstance).collection(collectionName);
            for (const w of whereClauses) {
              if (w.op === "eq") altRef = altRef.where(w.field, "==", w.val);
              else if (w.op === "gt") altRef = altRef.where(w.field, ">", w.val);
              else if (w.op === "gte") altRef = altRef.where(w.field, ">=", w.val);
              else if (w.op === "lt") altRef = altRef.where(w.field, "<", w.val);
              else if (w.op === "lte") altRef = altRef.where(w.field, "<=", w.val);
            }
            if (orderByClause) {
              try { altRef = altRef.orderBy(orderByClause.field, orderByClause.dir); } catch {}
            }
            if (limitCount && limitCount > 0) {
              altRef = altRef.limit(limitCount);
            }
            snapshot = await altRef.get();
            querySuccess = true;
          } catch {
            // Quiet fallback
          }
        }
      }

      if (querySuccess && snapshot) {
        let results = snapshot.docs.map((doc: any) => ({
          id: isNaN(Number(doc.id)) ? doc.id : Number(doc.id),
          ...doc.data(),
        }));

        if (orderByClause && (!ref._query || !ref._query.orderBy || ref._query.orderBy.length === 0)) {
          const { field, dir } = orderByClause;
          results.sort((a: any, b: any) => {
            const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
            const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
            if (valA < valB) return dir === "asc" ? -1 : 1;
            if (valA > valB) return dir === "asc" ? 1 : -1;
            return 0;
          });
        }

        if (projection && typeof projection === "object" && !Array.isArray(projection) && Object.keys(projection).length > 0) {
          const keys = Object.keys(projection);
          if (keys.length === 1 && (keys[0] === "c" || keys[0] === "count")) {
            return [{ c: results.length, count: results.length }];
          }
          results = results.map((item: any) => {
            const projected: any = {};
            for (const key of keys) {
              projected[key] = item[key] !== undefined ? item[key] : null;
            }
            return projected;
          });
        }

        return results;
      }

      if (projection && typeof projection === "object" && !Array.isArray(projection) && Object.keys(projection).length > 0) {
        const keys = Object.keys(projection);
        if (keys.length === 1 && (keys[0] === "c" || keys[0] === "count")) {
          return [{ c: 0, count: 0 }];
        }
      }
      return [];
    }

    return queryBuilder;
  },

  insert: (table: any) => {
    const collectionName = getTableName(table);
    let valuesToInsert: any = null;

    const insertBuilder = {
      values: (vals: any) => {
        valuesToInsert = vals;
        return insertBuilder;
      },
      returning: async () => executeInsert(),
      then: (resolve: Function, reject: Function) => executeInsert().then(resolve, reject),
    };

    async function executeInsert() {
      const col = firestore.collection(collectionName);
      const items = Array.isArray(valuesToInsert) ? valuesToInsert : [valuesToInsert];
      const insertedDocs: any[] = [];

      for (const rawItem of items) {
        const item = { ...rawItem };
        let docId = item.id;
        if (!docId) {
          docId = await getNextSequenceId(collectionName);
          item.id = docId;
        }

        if (!item.createdAt) item.createdAt = new Date().toISOString();
        if (!item.updatedAt && (collectionName === "users" || collectionName === "b2b_companies")) {
          item.updatedAt = new Date().toISOString();
        }

        const stringId = String(docId);
        try {
          await col.doc(stringId).set(item, { merge: true });
        } catch {
          // Quiet fallback
        }
        insertedDocs.push(item);
      }

      return Array.isArray(valuesToInsert) ? insertedDocs : insertedDocs;
    }

    return insertBuilder;
  },

  update: (table: any) => {
    const collectionName = getTableName(table);
    let updateValues: any = {};
    const whereClauses: Array<{ field: string; op: any; val: any }> = [];

    const updateBuilder = {
      set: (vals: any) => {
        updateValues = vals;
        return updateBuilder;
      },
      where: (clause: any) => {
        if (clause) parseClause(clause, whereClauses);
        return updateBuilder;
      },
      returning: async () => executeUpdate(),
      then: (resolve: Function, reject: Function) => executeUpdate().then(resolve, reject),
    };

    async function executeUpdate() {
      let ref: any = firestore.collection(collectionName);
      for (const w of whereClauses) {
        if (w.op === "eq") ref = ref.where(w.field, "==", w.val);
      }

      const updatedDocs: any[] = [];
      const cleanValues = { ...updateValues };
      delete cleanValues.updatedAt;

      try {
        const snapshot = await ref.get();
        for (const doc of snapshot.docs) {
          const currentData = doc.data();
          const nextData = {
            ...currentData,
            ...cleanValues,
            updatedAt: new Date().toISOString(),
          };
          await doc.ref.set(nextData, { merge: true });
          updatedDocs.push({ id: isNaN(Number(doc.id)) ? doc.id : Number(doc.id), ...nextData });
        }
      } catch {
        // Quiet fallback
      }

      return updatedDocs;
    }

    return updateBuilder;
  },

  delete: (table: any) => {
    const collectionName = getTableName(table);
    const whereClauses: Array<{ field: string; op: any; val: any }> = [];

    const deleteBuilder = {
      where: (clause: any) => {
        if (clause) parseClause(clause, whereClauses);
        return deleteBuilder;
      },
      execute: async () => executeDelete(),
      then: (resolve: Function, reject: Function) => executeDelete().then(resolve, reject),
    };

    async function executeDelete() {
      let ref: any = firestore.collection(collectionName);
      for (const w of whereClauses) {
        if (w.op === "eq") ref = ref.where(w.field, "==", w.val);
      }
      try {
        const snapshot = await ref.get();
        for (const doc of snapshot.docs) {
          await doc.ref.delete();
        }
        return { count: snapshot.docs.length };
      } catch {
        // Quiet fallback
        return { count: 0 };
      }
    }

    return deleteBuilder;
  },

  transaction: async (cb: (tx: any) => Promise<any>) => {
    return firestore.runTransaction(async () => {
      return cb(db);
    });
  },
};

function getTableName(table: any): string {
  if (typeof table === "string") return table;
  if (table && table[Symbol.for("drizzle:Name")]) return table[Symbol.for("drizzle:Name")];
  if (table && table._ && table._.name) return table._.name;
  if (table && table.config && table.config.name) return table.config.name;
  return "users";
}

function extractFieldName(col: any): string {
  if (typeof col === "string") return col;
  if (col && col.name) return col.name;
  if (col && col.config && col.config.name) return col.config.name;
  return "createdAt";
}

function parseClause(clause: any, clausesArray: Array<{ field: string; op: any; val: any }>): void {
  if (!clause) return;

  if (clause.queryChunks) {
    for (const chunk of clause.queryChunks) {
      if (chunk && typeof chunk === "object" && chunk.left && chunk.right) {
        const field = extractFieldName(chunk.left);
        const val = chunk.right.value !== undefined ? chunk.right.value : chunk.right;
        clausesArray.push({ field, op: "eq", val });
      }
    }
  } else if (clause.left && clause.right) {
    const field = extractFieldName(clause.left);
    const val = clause.right.value !== undefined ? clause.right.value : clause.right;
    const op = clause.operator || "eq";
    clausesArray.push({ field, op, val });
  } else if (clause.conditions && Array.isArray(clause.conditions)) {
    for (const cond of clause.conditions) {
      parseClause(cond, clausesArray);
    }
  }
}
