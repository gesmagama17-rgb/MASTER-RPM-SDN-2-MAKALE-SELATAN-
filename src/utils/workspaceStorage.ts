import {
  DEFAULT_GURU_PHOTO,
  createInitialFormData,
  type RPMDocument,
  type RPMFormData,
} from '../types/rpm';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface TeacherWorkspaceProfile {
  id: string;
  name: string;
  schoolName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTemplatePayload {
  version: 1;
  exportedAt: string;
  templateTitle: string;
  includePersonalIdentity: boolean;
  formData: Partial<RPMFormData>;
}

const WORKSPACE_LIST_KEY = 'rpm_sdn2_workspaces_v1';
const ACTIVE_WORKSPACE_LOCAL_KEY = 'rpm_sdn2_active_workspace_local_v1';
const ACTIVE_WORKSPACE_SESSION_KEY = 'rpm_sdn2_active_workspace_tab_v1';

// Legacy v1 keys (migrated once into ws_default so no existing work is lost)
const LEGACY_PHOTO_KEY = 'rpm_gesma_profile_photo_v1';
const LEGACY_PIN_LOCAL_KEY = 'rpm_gesma_access_pin_local_v1';
const LEGACY_PIN_SESSION_KEY = 'rpm_gesma_access_pin_session_v1';

export function sanitizeWorkspaceId(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || 'ws_default';
}

export function getWorkspaceKeys(workspaceId: string) {
  const safeId = sanitizeWorkspaceId(workspaceId);
  return {
    form: `rpm_sdn2_ws_${safeId}_form_v1`,
    rpm: `rpm_sdn2_ws_${safeId}_rpm_v1`,
    photo: `rpm_sdn2_ws_${safeId}_photo_v1`,
    pinLocal: `rpm_sdn2_ws_${safeId}_pin_local_v1`,
    pinSession: `rpm_sdn2_ws_${safeId}_pin_session_v1`,
  };
}

export function generateWorkspaceId(): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `ws_${Date.now().toString(36)}_${rand}`;
}

export function createBlankTeacherFormData(teacherName = ''): RPMFormData {
  const base = createInitialFormData();
  if (!teacherName.trim()) {
    return base;
  }
  return {
    ...base,
    namaGuru: teacherName.trim(),
    nipGuru: '',
  };
}

function safeReadJson<T>(storage: StorageLike | null | undefined, key: string): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWriteJson(storage: StorageLike | null | undefined, key: string, value: unknown): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function listWorkspaces(local: StorageLike | null | undefined): TeacherWorkspaceProfile[] {
  const existing = safeReadJson<TeacherWorkspaceProfile[]>(local, WORKSPACE_LIST_KEY);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  const now = new Date().toISOString();
  const initialForm = createInitialFormData();
  const defaultWorkspace: TeacherWorkspaceProfile = {
    id: 'ws_default',
    name: initialForm.namaGuru || 'Ruang Guru Utama',
    schoolName: initialForm.namaSatuanPendidikan,
    createdAt: now,
    updatedAt: now,
  };

  // Migrate legacy single-user keys once if present
  if (local) {
    const keys = getWorkspaceKeys(defaultWorkspace.id);
    try {
      const legacyPhoto = local.getItem(LEGACY_PHOTO_KEY);
      if (legacyPhoto && !local.getItem(keys.photo)) {
        local.setItem(keys.photo, legacyPhoto);
      }
      const legacyPin = local.getItem(LEGACY_PIN_LOCAL_KEY);
      if (legacyPin && !local.getItem(keys.pinLocal)) {
        local.setItem(keys.pinLocal, legacyPin);
      }
    } catch {
      // Ignore storage errors
    }
  }

  safeWriteJson(local, WORKSPACE_LIST_KEY, [defaultWorkspace]);
  return [defaultWorkspace];
}

export function createWorkspace(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  teacherName: string,
  schoolName = 'UPT SD Negeri 2 Makale Selatan'
): TeacherWorkspaceProfile {
  const list = listWorkspaces(local);
  const now = new Date().toISOString();
  const cleanName = teacherName.trim() || `Guru ${list.length + 1}`;
  const profile: TeacherWorkspaceProfile = {
    id: generateWorkspaceId(),
    name: cleanName,
    schoolName: schoolName.trim() || 'UPT SD Negeri 2 Makale Selatan',
    createdAt: now,
    updatedAt: now,
  };

  const nextList = [...list, profile];
  safeWriteJson(local, WORKSPACE_LIST_KEY, nextList);

  const freshForm: RPMFormData = {
    ...createInitialFormData(),
    namaGuru: cleanName,
    nipGuru: '',
    namaSatuanPendidikan: profile.schoolName,
  };
  saveWorkspaceForm(local, profile.id, freshForm);
  saveWorkspacePhoto(local, profile.id, DEFAULT_GURU_PHOTO);
  setActiveWorkspaceId(local, session, profile.id);
  return profile;
}

export function resolveInitialWorkspace(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  searchQuery = ''
): { workspaces: TeacherWorkspaceProfile[]; activeId: string; createdFromShareLink: boolean } {
  let workspaces = listWorkspaces(local);

  // If opened from a shared link (?guru=baru), create a clean isolated workspace once
  if (searchQuery) {
    try {
      const params = new URLSearchParams(searchQuery.startsWith('?') ? searchQuery : `?${searchQuery}`);
      if (params.get('guru') === 'baru') {
        const created = createWorkspace(local, session, `Guru Baru ${workspaces.length + 1}`);
        workspaces = listWorkspaces(local);
        return { workspaces, activeId: created.id, createdFromShareLink: true };
      }
    } catch {
      // Ignore malformed query
    }
  }

  // Prefer tab-scoped workspace ID first so two open tabs never collide on the same PC
  let tabId: string | null = null;
  let localId: string | null = null;
  try {
    tabId = session?.getItem(ACTIVE_WORKSPACE_SESSION_KEY) ?? null;
    localId = local?.getItem(ACTIVE_WORKSPACE_LOCAL_KEY) ?? null;
  } catch {
    // Ignore storage errors
  }

  const candidate = tabId || localId || workspaces[0].id;
  const matched = workspaces.find((w) => w.id === candidate) ?? workspaces[0];
  setActiveWorkspaceId(local, session, matched.id);
  return { workspaces, activeId: matched.id, createdFromShareLink: false };
}

export function setActiveWorkspaceId(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  workspaceId: string
): void {
  const safeId = sanitizeWorkspaceId(workspaceId);
  try {
    session?.setItem(ACTIVE_WORKSPACE_SESSION_KEY, safeId);
    local?.setItem(ACTIVE_WORKSPACE_LOCAL_KEY, safeId);
  } catch {
    // Ignore storage errors
  }
}

export function updateWorkspaceMetadata(
  local: StorageLike | null | undefined,
  workspaceId: string,
  updates: Partial<Pick<TeacherWorkspaceProfile, 'name' | 'schoolName'>>
): TeacherWorkspaceProfile[] {
  const list = listWorkspaces(local);
  const now = new Date().toISOString();
  const next = list.map((w) =>
    w.id === workspaceId
      ? {
          ...w,
          name: updates.name?.trim() || w.name,
          schoolName: updates.schoolName?.trim() || w.schoolName,
          updatedAt: now,
        }
      : w
  );
  safeWriteJson(local, WORKSPACE_LIST_KEY, next);
  return next;
}

export function deleteWorkspace(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  workspaceId: string
): { workspaces: TeacherWorkspaceProfile[]; nextActiveId: string } {
  const list = listWorkspaces(local);
  if (list.length <= 1) {
    return { workspaces: list, nextActiveId: list[0].id };
  }

  const keys = getWorkspaceKeys(workspaceId);
  try {
    local?.removeItem(keys.form);
    local?.removeItem(keys.rpm);
    local?.removeItem(keys.photo);
    local?.removeItem(keys.pinLocal);
    session?.removeItem(keys.pinSession);
  } catch {
    // Ignore storage errors
  }

  const nextList = list.filter((w) => w.id !== workspaceId);
  safeWriteJson(local, WORKSPACE_LIST_KEY, nextList);
  const nextActiveId = nextList[0].id;
  setActiveWorkspaceId(local, session, nextActiveId);
  return { workspaces: nextList, nextActiveId };
}

export function loadWorkspaceForm(
  local: StorageLike | null | undefined,
  workspaceId: string
): RPMFormData {
  const keys = getWorkspaceKeys(workspaceId);
  const saved = safeReadJson<Partial<RPMFormData>>(local, keys.form);
  const defaults = createInitialFormData();
  if (!saved) return defaults;
  return {
    ...defaults,
    ...saved,
    praktikPedagogisPerPertemuan:
      Array.isArray(saved.praktikPedagogisPerPertemuan) &&
      saved.praktikPedagogisPerPertemuan.length > 0
        ? saved.praktikPedagogisPerPertemuan
        : defaults.praktikPedagogisPerPertemuan,
    dimensiProfilLulusan:
      Array.isArray(saved.dimensiProfilLulusan) && saved.dimensiProfilLulusan.length > 0
        ? saved.dimensiProfilLulusan
        : defaults.dimensiProfilLulusan,
  };
}

export function saveWorkspaceForm(
  local: StorageLike | null | undefined,
  workspaceId: string,
  formData: RPMFormData
): void {
  const keys = getWorkspaceKeys(workspaceId);
  safeWriteJson(local, keys.form, formData);
}

export function loadWorkspaceRPM(
  local: StorageLike | null | undefined,
  workspaceId: string
): RPMDocument | null {
  const keys = getWorkspaceKeys(workspaceId);
  return safeReadJson<RPMDocument>(local, keys.rpm);
}

export function saveWorkspaceRPM(
  local: StorageLike | null | undefined,
  workspaceId: string,
  rpm: RPMDocument | null
): void {
  const keys = getWorkspaceKeys(workspaceId);
  if (!rpm) {
    try {
      local?.removeItem(keys.rpm);
    } catch {
      // Ignore errors
    }
    return;
  }
  safeWriteJson(local, keys.rpm, rpm);
}

export function loadWorkspacePhoto(
  local: StorageLike | null | undefined,
  workspaceId: string
): string {
  const keys = getWorkspaceKeys(workspaceId);
  try {
    return local?.getItem(keys.photo) || DEFAULT_GURU_PHOTO;
  } catch {
    return DEFAULT_GURU_PHOTO;
  }
}

export function saveWorkspacePhoto(
  local: StorageLike | null | undefined,
  workspaceId: string,
  photo: string
): void {
  const keys = getWorkspaceKeys(workspaceId);
  try {
    local?.setItem(keys.photo, photo);
  } catch {
    // Ignore errors
  }
}

export function loadWorkspacePin(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  workspaceId: string
): string {
  const keys = getWorkspaceKeys(workspaceId);
  try {
    const sPin = session?.getItem(keys.pinSession);
    if (sPin) return sPin;
    const lPin = local?.getItem(keys.pinLocal);
    if (lPin) return lPin;
    // Legacy session check only for default workspace
    if (sanitizeWorkspaceId(workspaceId) === 'ws_default') {
      return session?.getItem(LEGACY_PIN_SESSION_KEY) || local?.getItem(LEGACY_PIN_LOCAL_KEY) || '';
    }
    return '';
  } catch {
    return '';
  }
}

export function saveWorkspacePin(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  workspaceId: string,
  pin: string,
  remember: boolean
): void {
  const keys = getWorkspaceKeys(workspaceId);
  try {
    if (remember) {
      local?.setItem(keys.pinLocal, pin);
      session?.removeItem(keys.pinSession);
    } else {
      session?.setItem(keys.pinSession, pin);
      local?.removeItem(keys.pinLocal);
    }
  } catch {
    // Ignore errors
  }
}

export function clearWorkspacePin(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  workspaceId: string
): void {
  const keys = getWorkspaceKeys(workspaceId);
  try {
    local?.removeItem(keys.pinLocal);
    session?.removeItem(keys.pinSession);
    if (sanitizeWorkspaceId(workspaceId) === 'ws_default') {
      local?.removeItem(LEGACY_PIN_LOCAL_KEY);
      session?.removeItem(LEGACY_PIN_SESSION_KEY);
    }
  } catch {
    // Ignore errors
  }
}

export function buildShareableTemplateJson(
  formData: RPMFormData,
  includePersonalIdentity: boolean
): string {
  const cleanForm: Partial<RPMFormData> = {
    ...formData,
    namaGuru: includePersonalIdentity ? formData.namaGuru : '',
    nipGuru: includePersonalIdentity ? formData.nipGuru : '',
    namaKepalaSekolah: includePersonalIdentity ? formData.namaKepalaSekolah : '',
    nipKepalaSekolah: includePersonalIdentity ? formData.nipKepalaSekolah : '',
  };

  const payload: WorkspaceTemplatePayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    templateTitle: `${formData.mataPelajaran || 'RPM'} - ${formData.kelas || formData.fase}`,
    includePersonalIdentity,
    formData: cleanForm,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseShareableTemplateJson(
  rawJson: string,
  currentForm: RPMFormData
): RPMFormData | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<WorkspaceTemplatePayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.formData) {
      return null;
    }
    const incoming = parsed.formData;
    return {
      ...currentForm,
      ...incoming,
      // Keep receiver's own identity unless the template explicitly carries it and receiver didn't have one
      namaGuru: incoming.namaGuru ? incoming.namaGuru : currentForm.namaGuru,
      nipGuru: incoming.nipGuru ? incoming.nipGuru : currentForm.nipGuru,
      namaKepalaSekolah: incoming.namaKepalaSekolah
        ? incoming.namaKepalaSekolah
        : currentForm.namaKepalaSekolah,
      nipKepalaSekolah: incoming.nipKepalaSekolah
        ? incoming.nipKepalaSekolah
        : currentForm.nipKepalaSekolah,
    };
  } catch {
    return null;
  }
}
