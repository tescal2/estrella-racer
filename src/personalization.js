export const PROFILE_STORAGE_KEY = "estrella-racer-profile";

const DEFAULT_PROFILE = {
  primaryName: "Axel",
  secondaryName: "Jade"
};

function cleanName(name, fallback) {
  const normalized = String(name || "").trim().replace(/\s+/g, " ");
  if (!normalized) {
    return fallback;
  }
  return normalized.slice(0, 16);
}

export function getDefaultProfile() {
  return { ...DEFAULT_PROFILE };
}

export function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
    return {
      primaryName: cleanName(stored.primaryName, DEFAULT_PROFILE.primaryName),
      secondaryName: cleanName(stored.secondaryName, DEFAULT_PROFILE.secondaryName)
    };
  } catch {
    return getDefaultProfile();
  }
}

export function saveProfile(profile) {
  const safeProfile = {
    primaryName: cleanName(profile.primaryName, DEFAULT_PROFILE.primaryName),
    secondaryName: cleanName(profile.secondaryName, DEFAULT_PROFILE.secondaryName)
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(safeProfile));
  return safeProfile;
}

export function getPlateName(profile, index = 0) {
  const safeProfile = profile || DEFAULT_PROFILE;
  return index % 2 === 0 ? safeProfile.primaryName : safeProfile.secondaryName;
}
