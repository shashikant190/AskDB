// api.js
const API_URL = "http://127.0.0.1:8000";

async function safeFetch(path, opts = {}) {
    try {
        const res = await fetch(`${API_URL}${path}`, opts);
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok) {
            // Try to parse JSON error
            if (contentType.includes("application/json")) {
                const err = await res.json();
                return { error: err };
            }
            const txt = await res.text();
            return { error: txt || `HTTP ${res.status}` };
        }
        if (contentType.includes("application/json")) {
            return await res.json();
        }
        return { error: "Unsupported response content-type" };
    } catch (e) {
        return { error: e.message || String(e) };
    }
}

const api = {
    async connect(project, url) {
        return await safeFetch('/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project, database_url: url })
        });
    },

    async query(project, text) {
        return await safeFetch('/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project, text })
        });
    },

    async autodetect(project) {
        return await safeFetch(`/schema/autodetect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            // send project as query param
        }).then(async r => {
            if (!r.error) return r;
            // fallback to POST with query param if API expects it:
            return await safeFetch(`/schema/autodetect?project=${encodeURIComponent(project)}`, {
                method: 'POST'
            });
        });
    },

    async loadSchema(project) {
        return await safeFetch(`/schema/load?project=${encodeURIComponent(project)}`, {
            method: 'POST'
        });
    },

    async saveSchema(project, schemaObj) {
        // Option A: POST the current schema to /schema (in-memory) then save
        // First set schema into memory
        const setRes = await safeFetch(`/schema?project=${encodeURIComponent(project)}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(schemaObj)
        });
        if (setRes.error) return setRes;
        // now call save
        return await safeFetch(`/schema/save?project=${encodeURIComponent(project)}`, {
            method: 'POST'
        });
    }
};
