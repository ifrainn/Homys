import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  StyleSheet,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useWindowDimensions } from "react-native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import AuthScreen from "./AuthScreen";
import * as Localization from "expo-localization";

/** ------------------------------ translations ------------------------------ */
const pickDeviceLang = async()=> {
  const saved = await AsyncStorage.getItem(KEY_LANG);
  if (saved === "en" || saved === "fr" || saved === "ar") return saved;

  try {
    const loc = Localization.getLocales?.()[0];
    const code = (loc?.languageCode || "en").toLowerCase();
    return code === "ar" ? "ar" : code === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
};

const KEY_LANG = "Homeday.lang.v1";

const TR = {
  en: {
    login: "Log in",
signup: "Sign up",
emailLabel: "Email",
passwordLabel: "Password",
show: "Show",
hide: "Hide",
or: "or",
continueWithGoogle: "Continue with Google",
createAccountCta: "No account? Create one",
haveAccountCta: "Have an account? Log in",
loginFailedTitle: "Login failed",
googleSigninFailedTitle: "Google sign-in failed",
passMin: "Password must be at least 6 characters",
checkSpamBody: "If you don't see the email, check Spam/Promotions and mark it as Not spam.",
    forgotPassword: "Forgot password?",
resetEmailSentTitle: "Check your inbox",
resetEmailSentBody: "We sent you a password reset link. check SPAM too.",
resetFailedTitle: "Reset failed",
emailRequired: "Email required",

    errInvalidCredentials: "Incorrect email or password.",
    errUserNotFound: "No account found with this email.",
    errTooManyRequests: "Too many attempts. Please try again later.",
    errNetwork: "Network error. Please check your connection.",
    errGeneric: "Something went wrong. Please try again.",
    timeline: "Timeline",
    apartments: "Apartments",
    today: "Today",
    historyOn: "History ON",
    historyOff: "History OFF",
    free: "Free",
    reserved: "Reserved",
    occupied: "Occupied",
    apartment: "Apartment",
    status: "Status",
    startDate: "Start date",
    endDate: "End date",
    guestName: "Guest name",
    phone: "Phone (Num)",
    cin: "CIN",
    pricePerDay: "Price / Day (optional)",
    notes: "Notes (optional)",
    cancel: "Cancel",
    save: "Save",
    prev: "Prev",
    next: "Next",
    revenue: "Revenue",
    charges: "Charges",
    net: "Net",
    addApartment: "Add Apartment",
    edit: "Edit",
    addCharge: "Add Charge",
    remove: "Remove",
    removeApartmentTitle: "Remove apartment",
    removeApartmentBody: "This will also remove its reservations & charges. Continue?",
    date: "Date",
    amount: "Amount",
    noteOptional: "Note (optional)",
    aboutTitle: "About",
    aboutText:
      "Homeday helps you manage apartment reservations, occupancy and monthly earnings.",
    language: "Language",
    english: "English",
    french: "Français",
    logout: "Log out",
    poweredBy: "Powered by ",
    couldNotSaveReservation: "Could not save reservation. ",
    invalidDates: "Invalid dates",
    invalidDatesBody: "End date must be the same as or after the start date.",
    arabic: "العربية",
  },
  fr: {
    login: "Se connecter",
signup: "Créer un compte",
emailLabel: "Email",
passwordLabel: "Mot de passe",
show: "Afficher",
hide: "Masquer",
or: "ou",
continueWithGoogle: "Continuer avec Google",
createAccountCta: "Pas de compte ? Créez-en un",
haveAccountCta: "Vous avez un compte ? Connectez-vous",
loginFailedTitle: "Échec de la connexion",
googleSigninFailedTitle: "Échec de la connexion Google",
passMin: "Le mot de passe doit contenir au moins 6 caractères",
checkSpamBody: "Si vous ne trouvez pas l’e-mail, regardez dans Spam/Promotions et marquez « Pas spam ».",
    forgotPassword: "Mot de passe oublié ?",
resetEmailSentTitle: "Consultez votre boîte de réception",
resetEmailSentBody: "Nous vous avons envoyé un lien de réinitialisation du mot de passe, vérifiez aussi les SPAM.",
resetFailedTitle: "Échec de la réinitialisation",
emailRequired: "Email requis",

    errInvalidCredentials: "Email ou mot de passe incorrect.",
    errUserNotFound: "Aucun compte trouvé avec cet email.",
    errTooManyRequests: "Trop de tentatives. Réessayez plus tard.",
    errNetwork: "Erreur réseau. Vérifiez votre connexion.",
    errGeneric: "Une erreur est survenue. Veuillez réessayer.",

    arabic: "العربية",
    timeline: "Planning",
    apartments: "Appartements",
    today: "Aujourd’hui",
    historyOn: "Historique ON",
    historyOff: "Historique OFF",
    free: "Libre",
    reserved: "Réservé",
    occupied: "Occupé",
    apartment: "Appartement",
    status: "Statut",
    startDate: "Date de début",
    endDate: "Date de fin",
    guestName: "Nom du client",
    phone: "Téléphone (Num)",
    cin: "CIN",
    pricePerDay: "Prix / Jour (optionnel)",
    notes: "Notes (optionnel)",
    cancel: "Annuler",
    save: "Enregistrer",
    prev: "Préc.",
    next: "Suiv.",
    revenue: "Recettes",
    charges: "Dépenses",
    net: "Net",
    addApartment: "Ajouter un appartement",
    edit: "Modifier",
    addCharge: "Ajouter dépense",
    remove: "Supprimer",
    removeApartmentTitle: "Supprimer l’appartement",
    removeApartmentBody:
      "Cela supprimera aussi ses réservations & dépenses. Continuer ?",
    date: "Date",
    amount: "Montant",
    noteOptional: "Note (optionnel)",
    aboutTitle: "À propos",
    aboutText:
      "Homeday vous aide à gérer les réservations, l’occupation et les revenus mensuels.",
    language: "Langue",
    english: "English",
    french: "Français",
    logout: "Se déconnecter",
    poweredBy: "Propulsé par ",
    couldNotSaveReservation: "Impossible d’enregistrer la réservation. ",
    invalidDates: "Dates invalides",
    invalidDatesBody:
      "La date de fin doit être identique ou postérieure à la date de début.",
      checkSpamTitle: "Vérifiez vos e-mails",
checkSpamBody: "Si vous ne trouvez pas l’e-mail, regardez dans Spam/Promotions et marquez « Pas spam ».",
resendEmail: "Renvoyer l’e-mail",
resendIn: (s) => `Renvoyer dans ${s}s`,
openMailApp: "Ouvrir ma messagerie",
  },
  ar: {
    login: "تسجيل الدخول",
signup: "إنشاء حساب",
emailLabel: "البريد الإلكتروني",
passwordLabel: "كلمة المرور",
show: "إظهار",
hide: "إخفاء",
or: "أو",
continueWithGoogle: "المتابعة باستخدام Google",
createAccountCta: "لا تملك حسابًا؟ أنشئ واحدًا",
haveAccountCta: "لديك حساب؟ سجّل الدخول",
loginFailedTitle: "فشل تسجيل الدخول",
googleSigninFailedTitle: "فشل تسجيل الدخول بواسطة Google",
passMin: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل",
checkSpamBody: "إذا لم تجد البريد، تحقّق من الرسائل غير المرغوب فيها/الترويجية وضع علامة «ليس بريدًا مزعجًا».",
    forgotPassword: "هل نسيت كلمة المرور؟",
resetEmailSentTitle: "تحقق من بريدك",
resetEmailSentBody: "(SPAM) لقد أرسلنا إليك رابطًا لإعادة تعيين كلمة المرور . تحقق من الرسائل غير المرغوب فيها أيضًا.",
resetFailedTitle: "فشل إعادة التعيين",
emailRequired: "البريد الإلكتروني مطلوب",

    errInvalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    errUserNotFound: "لا يوجد حساب مرتبط بهذا البريد.",
    errTooManyRequests: "محاولات كثيرة. حاول لاحقًا.",
    errNetwork: "خطأ في الشبكة. تحقق من الاتصال.",
    errGeneric: "حدث خطأ ما. حاول مرة أخرى.",

    timeline: "المخطط",
    apartments: "الشقق",
    today: "اليوم",
    historyOn: "السجل مفعل",
    historyOff: "السجل معطل",
    free: "شاغر",
    reserved: "محجوز",
    occupied: "مشغول",
    apartment: "شقة",
    status: "الحالة",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    guestName: "اسم النزيل",
    phone: "الهاتف (رقم)",
    cin: "بطاقة التعريف",
    pricePerDay: "السعر/اليوم (اختياري)",
    notes: "ملاحظات (اختياري)",
    cancel: "إلغاء",
    save: "حفظ",
    prev: "السابق",
    next: "التالي",
    revenue: "الإيرادات",
    charges: "المصاريف",
    net: "الصافي",
    addApartment: "إضافة شقة",
    edit: "تعديل",
    addCharge: "إضافة مصروف",
    remove: "حذف",
    removeApartmentTitle: "حذف الشقة",
    removeApartmentBody: "سيتم حذف حجوزاتها ومصاريفها أيضًا. هل تريد المتابعة؟",
    date: "التاريخ",
    amount: "المبلغ",
    noteOptional: "ملاحظة (اختياري)",
    aboutTitle: "حول",
    aboutText: "يساعدك HomeDay على إدارة حجوزات الشقق، الإشغال، والأرباح الشهرية.  ",
    language: "اللغة",
    english: "English",
    french: "Français",
    arabic: "العربية",
    logout: "تسجيل الخروج",
    poweredBy: "بدعم من ",
    couldNotSaveReservation: "تعذر حفظ الحجز. ",
    invalidDates: "تواريخ غير صالحة",
    invalidDatesBody: "يجب أن يكون تاريخ الانتهاء مساويًا أو بعد تاريخ البدء."
  },
};

/** Storage keys (used only for one-time migration) */
const KEY_APTS = "Homeday.apartments.v2"; // v2: adds pricePerDay
const KEY_RES = "Homeday.reservations.v1";
const KEY_CHARGES = "Homeday.charges.v1"; // { [aptId]: Array<{id,date,amount,note}> }

/** Sizing (fixed heights keep rows aligned) */
const NAME_COL_WIDTH = 88; // fixed left column
const DAY_COL_WIDTH = 110; // each timeline day
const HEADER_HEIGHT = 40; // header cells
const ROW_HEIGHT = 56; // row cells (same on both sides)

/** Range control */
const PAST_WHEN_HISTORY_ON = 90;
const FUTURE_DAYS = 365;

/** Utils */
const dateOnly = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return dateOnly(x);
};
const inRangeInclusive = (day, start, end) => {
  const t = dateOnly(day).getTime();
  return t >= dateOnly(start).getTime() && t <= dateOnly(end).getTime();
};
const fmtDayShort = (d, l) =>
  d.toLocaleDateString(l, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const fmtDayTiny = (d, l) =>
  d.toLocaleDateString(l, { day: "2-digit", month: "2-digit" });
const fmtDateLong = (d, l) =>
  d.toLocaleDateString(l, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const fmtMonthYear = (d, l) =>
  d.toLocaleDateString(l, { year: "numeric", month: "long" });

const STATUS = { FREE: "free", RESERVED: "reserved", OCCUPIED: "occupied" };
const startOfMonth = (d) => {
  const x = dateOnly(d);
  x.setDate(1);
  return x;
};
const endOfMonth = (d) => {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  return dateOnly(x);
};
const daysInMonthArr = (d) => {
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  const out = [];
  for (let x = new Date(start); x <= end; x.setDate(x.getDate() + 1))
    out.push(dateOnly(x));
  return out;
};


/* --------------------------- Root: Auth + Loading -------------------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // tiny loader while auth restores
  
  //const [lang, setLang] = useState(pickDeviceLang());
  const [lang, setLang] = useState("en");
  const t = useCallback((key) => (TR[lang]?.[key] ?? TR.en[key] ?? key), [lang]);
//  useEffect(() => {
//  const sub = Localization.addLocalizationListener?.(() => {
//    setLang(pickDeviceLang());
//  });
//  return () => sub?.remove?.();
//}, []);
useEffect(() => {
  let mounted = true;

  // async boot: read saved pref or device locale
  (async () => {
    const initial = await pickDeviceLang();
    if (mounted) setLang(initial);
  })();

  // react to OS locale changes
  const sub = Localization.addLocalizationListener?.(async () => {
    const next = await pickDeviceLang();
    if (mounted) setLang(next);
  });

  return () => {
    mounted = false;
    sub?.remove?.();
  };
}, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setBooting(false);
    });
    return unsub;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {booting ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : user ? (
        <LoggedInApp user={user} lang={lang} setLang={setLang} t={t} />
      ) : (
        <AuthScreen onAuthed={setUser} t={t} />
      )}
    </SafeAreaProvider>
  );
}

/* ---------------------------- Logged-in experience ---------------------------- */
function LoggedInApp({ user, lang, setLang, t }) {
  const isRTL = lang === "ar";
const locale = isRTL ? "ar" : (lang === "fr" ? "fr" : "en");
const { width,height  } = useWindowDimensions();
const shortSide = Math.min(width, height);   // <— compute it, don’t destructure
const [chargesManagerOpen, setChargesManagerOpen] = useState(false);
const [chargesForApt, setChargesForApt] = useState(null); // aptId
const [showAddChargeForm, setShowAddChargeForm] = useState(false);
const [expandedChargeId, setExpandedChargeId] = useState(null);
const toggleChargeExpand = (id) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedChargeId(prev => (prev === id ? null : id));
};

// Center popup for adding a charge
const [addChargeOpen, setAddChargeOpen] = useState(false);

const [addChargeForm, setAddChargeForm] = useState({
  date: dateOnly(new Date()),
  amount: "",
  note: "",
});

// Editing a row
const [editingChargeId, setEditingChargeId] = useState(null);
const [editChargeForm, setEditChargeForm] = useState({
  date: dateOnly(new Date()),
  amount: "",
  note: "",
});

// Pickers inside manager (iOS / Android)
const [showIOSChargeAdd, setShowIOSChargeAdd] = useState(false);
const [showChargeAddPicker, setShowChargeAddPicker] = useState(false); // Android

const [showIOSChargeEdit, setShowIOSChargeEdit] = useState(false);
const [showChargeEditPicker, setShowChargeEditPicker] = useState(false); // Android
// Breakpoints tuned for Android too
const ultraCompact = shortSide < 360;  // very small phones
const compact = shortSide < 430;       // most phones in portrait (Android ~411dp)
const showActionLabels = shortSide >= 380;
// Use narrower columns in compact mode
const dayColWidth = compact ? 96 : DAY_COL_WIDTH;
const nameColWidth = ultraCompact ? 72 : NAME_COL_WIDTH;
  /** Tabs */
  const [tab, setTab] = useState("timeline"); // "timeline" | "apartments"
  const [showIOSStart, setShowIOSStart] = useState(false);
const [showIOSEnd, setShowIOSEnd] = useState(false);
const [showIOSCharge, setShowIOSCharge] = useState(false);

  /** Cloud data (driven by Firestore listeners) */
  const [apartments, setApartments] = useState([]); // [{id, name, pricePerDay?}]
  const [reservations, setReservations] = useState({}); // { [aptId]: Array<{...}> }
  const [charges, setCharges] = useState({}); // { [aptId]: Array<{...}> }

  /** Settings modal */
  const [settingsOpen, setSettingsOpen] = useState(false);

  /** Apartment modal (MOVED INSIDE COMPONENT) */
  const [aptModal, setAptModal] = useState(false);
  const [aptEditing, setAptEditing] = useState(null);
  const [aptForm, setAptForm] = useState({ name: "" });

  /** One-time migration guard */
  const [migrationDone, setMigrationDone] = useState(false);

  /** History (OFF = only today→future) */
  const [historyEnabled, setHistoryEnabled] = useState(false);

  /** Build days according to history toggle */
  const today = dateOnly(new Date());
  const days = useMemo(() => {
    if (historyEnabled) {
      const start = addDays(today, -PAST_WHEN_HISTORY_ON);
      const total = PAST_WHEN_HISTORY_ON + FUTURE_DAYS + 1;
      return Array.from({ length: total }, (_, i) => addDays(start, i));
    } else {
      return Array.from({ length: FUTURE_DAYS + 1 }, (_, i) => addDays(today, i));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyEnabled]);

  const todayIndex = historyEnabled ? PAST_WHEN_HISTORY_ON : 0;

  /** Refs */
  const hListRef = useRef(null);

  /** Initial jump to today on the horizontal list */
  useEffect(() => {
    if (tab !== "timeline") return;
    if (hListRef.current) {
      try {
        hListRef.current.scrollToIndex({
          index: Math.max(0, Math.min(todayIndex, (days?.length || 1) - 1)),
          animated: false,
        });
      } catch {}
    }
  }, [todayIndex, days.length, tab]);

  /** Reservation modal */
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null); // { aptId, resId|null, day }
  const [form, setForm] = useState({
    start: dateOnly(new Date()),
    end: addDays(new Date(), 1),
    status: STATUS.RESERVED,
    guestName: "",
    phone: "",
    cin: "",
    pricePerDay: "",
    notes: "",
  });

  const [showStartPicker, setShowStartPicker] = useState(false); // Android only
  const [showEndPicker, setShowEndPicker] = useState(false); // Android only

  /** Charge modal */
  const [chargeModal, setChargeModal] = useState(false);
  const [chargeForApt, setChargeForApt] = useState(null); // aptId
  const [chargeForm, setChargeForm] = useState({
    date: dateOnly(new Date()),
    amount: "",
    note: "",
  });
  const [showChargeDatePicker, setShowChargeDatePicker] = useState(false); // Android only

  /** iOS DatePicker bottom sheet (shared) */
 

  /** Month selector (Apartments screen) */
  const [monthCursor, setMonthCursor] = useState(startOfMonth(new Date()));
  useMemo(() => daysInMonthArr(monthCursor), [monthCursor]); // keep if needed later

  /* ----------------------- Firestore: Live listeners ----------------------- */
  // 1) apartments
  useEffect(() => {
    const aptsRef = collection(db, "users", user.uid, "apartments");
    const unsub = onSnapshot(aptsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const an = (a.name || "").localeCompare(b.name || "");
        if (an !== 0) return an;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
      setApartments(list);
    });
    return unsub;
  }, [user.uid]);

  // 2) reservations & charges by apartment
  useEffect(() => {
    const unsubs = [];

    apartments.forEach((apt) => {
      const resRef = collection(
        db,
        "users",
        user.uid,
        "apartments",
        apt.id,
        "reservations"
      );
      const unsubRes = onSnapshot(query(resRef), (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.start || 0) - (b.start || 0));
        setReservations((prev) => ({ ...prev, [apt.id]: list }));
      });
      unsubs.push(unsubRes);

      const chRef = collection(
        db,
        "users",
        user.uid,
        "apartments",
        apt.id,
        "charges"
      );
      const unsubCh = onSnapshot(query(chRef), (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.date || 0) - (b.date || 0));
        setCharges((prev) => ({ ...prev, [apt.id]: list }));
      });
      unsubs.push(unsubCh);
    });

    return () => {
      unsubs.forEach((u) => u && u());
    };
    // rerun when set of apt IDs changes
  }, [user.uid, apartments.map((a) => a.id).join("|")]);

  // 3) One-time migration from local AsyncStorage -> Firestore (if cloud empty)
  useEffect(() => {
    if (migrationDone) return;

    const run = async () => {
      const aptsRef = collection(db, "users", user.uid, "apartments");
      const snap = await getDocs(aptsRef);
      const cloudEmpty = snap.empty;

      if (!cloudEmpty) {
        setMigrationDone(true);
        return;
      }

      const [aRaw, rRaw, cRaw] = await Promise.all([
        AsyncStorage.getItem(KEY_APTS),
        AsyncStorage.getItem(KEY_RES),
        AsyncStorage.getItem(KEY_CHARGES),
      ]);

      const localApts = aRaw ? JSON.parse(aRaw) : [];
      const localRes = rRaw ? JSON.parse(rRaw) : {};
      const localCh = cRaw ? JSON.parse(cRaw) : {};

      if (localApts.length === 0) {
        await addDoc(aptsRef, { name: "Apt 1", createdAt: Date.now() });
        await addDoc(aptsRef, { name: "Apt 2", createdAt: Date.now() });
        setMigrationDone(true);
        return;
      }

      for (const apt of localApts) {
        const docRef = await addDoc(aptsRef, {
          name: apt.name || "Apartment",
          pricePerDay: Number.isFinite(apt.pricePerDay) ? apt.pricePerDay : null,
          createdAt: Date.now(),
        });
        const newAptId = docRef.id;

        // Reservations
        const resForOldApt = localRes[apt.id] || [];
        for (const r of resForOldApt) {
          const resCol = collection(
            db,
            "users",
            user.uid,
            "apartments",
            newAptId,
            "reservations"
          );
          await addDoc(resCol, {
            start: +new Date(r.start),
            end: +new Date(r.end),
            status: r.status || STATUS.RESERVED,
            guestName: r.guestName || "",
            phone: r.phone || "",
            cin: r.cin || "",
            pricePerDay: Number.isFinite(r.pricePerDay) ? r.pricePerDay : null,
            notes: r.notes || "",
            createdAt: Date.now(),
          });
        }

        // Charges
        const chForOldApt = localCh[apt.id] || [];
        for (const c of chForOldApt) {
          const chCol = collection(
            db,
            "users",
            user.uid,
            "apartments",
            newAptId,
            "charges"
          );
          await addDoc(chCol, {
            date: +new Date(c.date),
            amount: Number(c.amount) || 0,
            note: c.note || "",
            createdAt: Date.now(),
          });
        }
      }

      setMigrationDone(true);
    };

    run().catch(() => setMigrationDone(true));
  }, [user.uid, migrationDone]);

  /* ---------------------- Helpers (timeline rendering) ---------------------- */
  const getCellState = useCallback(
    (aptId, day) => {
      const list = reservations[aptId] || [];
      let hit = null;
      for (const r of list) {
        if (inRangeInclusive(day, r.start, r.end)) {
          if (!hit) hit = r;
          else if (r.status === STATUS.OCCUPIED && hit.status !== STATUS.OCCUPIED)
            hit = r;
        }
      }
      if (!hit) return { status: STATUS.FREE, label: "" };
      return {
        status: hit.status,
        label: hit.guestName
          ? hit.guestName
          : hit.status === STATUS.OCCUPIED
          ? t("occupied")
          : t("reserved"),
        res: hit,
      };
    },
    [reservations, t]
  );

  const openCreateOrEdit = (aptId, day) => {
    const current = getCellState(aptId, day);
    setEditing({ aptId, resId: current.res?.id ?? null, day });

    if (current.res) {
      setForm({
        start: dateOnly(new Date(current.res.start)),
        end: dateOnly(new Date(current.res.end)),
        status: current.res.status,
        guestName: current.res.guestName || "",
        phone: current.res.phone || "",
        cin: current.res.cin || "",
        pricePerDay:
          current.res.pricePerDay != null
            ? String(current.res.pricePerDay)
            : "",
        notes: current.res.notes || "",
      });
    } else {
      setForm({
        start: dateOnly(day),
        end: dateOnly(day),
        status: STATUS.RESERVED,
        guestName: "",
        phone: "",
        cin: "",
        pricePerDay: "",
        notes: "",
      });
    }
    setModalVisible(true);
  };

  /* -------------------------- Firestore CRUD wrappers -------------------------- */
  const fsCreateApartment = async (name, pricePerDay) => {
    const aptsRef = collection(db, "users", user.uid, "apartments");
    await addDoc(aptsRef, {
      name,
      pricePerDay: Number.isFinite(pricePerDay) ? pricePerDay : null,
      createdAt: Date.now(),
    });
  };

  const fsUpdateApartment = async (aptId, patch) => {
    await updateDoc(doc(db, "users", user.uid, "apartments", aptId), patch);
  };

  const fsDeleteApartment = async (aptId) => {
    // delete subcollections first, then the apartment
    const resCol = collection(
      db,
      "users",
      user.uid,
      "apartments",
      aptId,
      "reservations"
    );
    const resSnap = await getDocs(resCol);
    await Promise.all(resSnap.docs.map((d) => deleteDoc(d.ref)));

    const chCol = collection(
      db,
      "users",
      user.uid,
      "apartments",
      aptId,
      "charges"
    );
    const chSnap = await getDocs(chCol);
    await Promise.all(chSnap.docs.map((d) => deleteDoc(d.ref)));

    await deleteDoc(doc(db, "users", user.uid, "apartments", aptId));
  };

  const fsCreateReservation = async (aptId, r) => {
    const resRef = collection(
      db,
      "users",
      user.uid,
      "apartments",
      aptId,
      "reservations"
    );
    await addDoc(resRef, {
      start: +dateOnly(r.start),
      end: +dateOnly(r.end),
      status: r.status,
      guestName: (r.guestName || "").trim(),
      phone: (r.phone || "").trim(),
      cin: (r.cin || "").trim().toUpperCase(),
      pricePerDay: Number.isFinite(r.pricePerDay) ? r.pricePerDay : null,
      notes: (r.notes || "").trim(),
      createdAt: Date.now(),
    });
  };

  const fsUpdateReservation = async (aptId, resId, patch) => {
    // Never pass undefined to Firestore
    const shaped = {
      ...(patch.start ? { start: +dateOnly(patch.start) } : {}),
      ...(patch.end ? { end: +dateOnly(patch.end) } : {}),
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.guestName != null ? { guestName: patch.guestName } : {}),
      ...(patch.phone != null ? { phone: patch.phone } : {}),
      ...(patch.cin != null ? { cin: patch.cin } : {}),
      ...(patch.pricePerDay !== undefined
        ? {
            pricePerDay: Number.isFinite(patch.pricePerDay)
              ? patch.pricePerDay
              : null,
          }
        : {}),
      ...(patch.notes != null ? { notes: patch.notes } : {}),
    };
    await updateDoc(
      doc(db, "users", user.uid, "apartments", aptId, "reservations", resId),
      shaped
    );
  };

  const fsDeleteReservation = async (aptId, resId) => {
    await deleteDoc(
      doc(db, "users", user.uid, "apartments", aptId, "reservations", resId)
    );
  };

  const fsCreateCharge = async (aptId, c) => {
    const chRef = collection(db, "users", user.uid, "apartments", aptId, "charges");
    await addDoc(chRef, {
      date: +dateOnly(c.date),
      amount: Number(c.amount) || 0,
      note: (c.note || "").trim(),
      createdAt: Date.now(),
    });
  };
  const fsUpdateCharge = async (aptId, chargeId, patch) => {
  const shaped = {
    ...(patch.date ? { date: +dateOnly(patch.date) } : {}),
    ...(patch.amount != null ? { amount: Number(patch.amount) || 0 } : {}),
    ...(patch.note != null ? { note: patch.note } : {}),
  };
  await updateDoc(
    doc(db, "users", user.uid, "apartments", aptId, "charges", chargeId),
    shaped
  );
};

const fsDeleteChargeDoc = async (aptId, chargeId) => {
  await deleteDoc(doc(db, "users", user.uid, "apartments", aptId, "charges", chargeId));
};

  /* ----------------------- UI handlers call Firestore ----------------------- */
  const openChargesManager = (aptId) => {
  setExpandedChargeId(null); // reset
  setChargesForApt(aptId);
  setAddChargeForm({ date: dateOnly(new Date()), amount: "", note: "" });
  setShowIOSChargeAdd(false);
  setShowChargeAddPicker(false);
  setChargesManagerOpen(true);
};

const addNewCharge = async () => {
  const amountNum = parseFloat(addChargeForm.amount);
  if (!isFinite(amountNum)) {
    Alert.alert("Error", "Enter a valid amount");
    return;
  }
  try {
    await fsCreateCharge(chargesForApt, { ...addChargeForm, amount: amountNum });
    setAddChargeForm({ date: dateOnly(new Date()), amount: "", note: "" });
    setShowIOSChargeAdd(false);
  } catch (e) {
    Alert.alert("Error", (e?.message || "").toString());
  }
};



const confirmDeleteCharge = (chargeId) => {
  Alert.alert("Delete", "Delete this charge?", [
    { text: t("cancel"), style: "cancel" },
    {
      text: t("remove"),
      style: "destructive",
      onPress: async () => {
        try {
          await fsDeleteChargeDoc(chargesForApt, chargeId);
        } catch (e) {
          Alert.alert("Error", (e?.message || "").toString());
        }
      },
    },
  ]);
};

  const saveReservation = async () => {
    if (!editing) return;
    if (form.end < form.start) {
      Alert.alert(t("invalidDates"), t("invalidDatesBody"));
      return;
    }
    const priceNum = parseFloat(form.pricePerDay);
    const priceField = Number.isFinite(priceNum) ? priceNum : null; // <— never undefined

    try {
      if (editing.resId) {
        await fsUpdateReservation(editing.aptId, editing.resId, {
          start: form.start,
          end: form.end,
          status: form.status,
          guestName: form.guestName?.trim(),
          phone: form.phone?.trim(),
          cin: form.cin?.trim()?.toUpperCase(),
          pricePerDay: priceField,
          notes: form.notes?.trim(),
        });
      } else {
        await fsCreateReservation(editing.aptId, {
          start: form.start,
          end: form.end,
          status: form.status,
          guestName: form.guestName?.trim(),
          phone: form.phone?.trim(),
          cin: form.cin?.trim()?.toUpperCase(),
          pricePerDay: priceField,
          notes: form.notes?.trim(),
        });
      }
      setShowIOSStart(false);
    setShowIOSEnd(false);

    setModalVisible(false);
    setEditing(null);
    } catch (e) {
      Alert.alert("Error", t("couldNotSaveReservation") + (e?.message || ""));
    }
  };

  const deleteReservation = () => {
    if (!editing?.resId) return;
    Alert.alert("Delete", "Delete this reservation?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await fsDeleteReservation(editing.aptId, editing.resId);
            setShowIOSStart(false);
            setShowIOSEnd(false);
            setModalVisible(false);
            setEditing(null);
          } catch (e) {
            Alert.alert("Error", (e?.message || "").toString());
          }
        },
      },
    ]);
  };

  const openAptModal = (apt = null) => {
    setAptEditing(apt ? apt.id : null);
    setAptForm({ name: apt?.name || "" });
    setAptModal(true);
  };

  const saveApartment = async () => {
    const name = aptForm.name.trim();
    if (!name) return;
    try {
      if (aptEditing) {
        await fsUpdateApartment(aptEditing, { name });
      } else {
        await fsCreateApartment(name, null);
      }
      setAptModal(false);
    } catch (e) {
      Alert.alert("Error", (e?.message || "").toString());
    }
  };

  const removeApartment = (id) => {
    Alert.alert(t("removeApartmentTitle"), t("removeApartmentBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await fsDeleteApartment(id);
          } catch (e) {
            Alert.alert("Error", (e?.message || "").toString());
          }
        },
      },
    ]);
  };

  const openChargeModal = (aptId) => {
    setChargeForApt(aptId);
    setChargeForm({ date: dateOnly(new Date()), amount: "", note: "" });
    setChargeModal(true);
  };

  const saveCharge = async () => {
    const amount = parseFloat(chargeForm.amount);
    if (!isFinite(amount)) return;
    try {
      await fsCreateCharge(chargeForApt, { ...chargeForm, amount });
      setShowIOSCharge(false);
      setChargeModal(false);
    } catch (e) {
      Alert.alert("Error", (e?.message || "").toString());
    }
  };

  /* ----------------------- Stats (per month & totals) ----------------------- */
  const computeMonthStatsForApt = (aptId, monthDate) => {
    const daysArr = daysInMonthArr(monthDate);
    let reserved = 0,
      occupied = 0;
    for (const d of daysArr) {
      const s = (reservations[aptId] || []).reduce((acc, r) => {
        if (!inRangeInclusive(d, r.start, r.end)) return acc;
        if (acc === STATUS.OCCUPIED) return acc;
        return r.status === STATUS.OCCUPIED ? STATUS.OCCUPIED : STATUS.RESERVED;
      }, STATUS.FREE);
      if (s === STATUS.RESERVED) reserved++;
      if (s === STATUS.OCCUPIED) occupied++;
    }

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const resList = reservations[aptId] || [];
    let revenue = 0;
    for (const r of resList) {
      const resStart = dateOnly(new Date(r.start));
      const resEnd = dateOnly(new Date(r.end));
      const overlapStart = resStart > monthStart ? resStart : monthStart;
      const overlapEnd = resEnd < monthEnd ? resEnd : monthEnd;
      if (overlapEnd < overlapStart) continue;

      const nights =
        Math.round((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
      const price = r.pricePerDay != null ? r.pricePerDay : 0;
      revenue += nights * price;
    }

    const chargesSum = (charges[aptId] || [])
      .filter((c) => {
        const cd = dateOnly(new Date(c.date));
        return cd >= monthStart && cd <= monthEnd;
      })
      .reduce((a, c) => a + (c.amount || 0), 0);

    const net = revenue - chargesSum;
    return { reserved, occupied, bookedNights: reserved + occupied, revenue, charges: chargesSum, net };
  };

  const projectTotals = useMemo(() => {
    let reserved = 0,
      occupied = 0,
      revenue = 0,
      chargesSum = 0;
    for (const apt of apartments) {
      const s = computeMonthStatsForApt(apt.id, monthCursor);
      reserved += s.reserved;
      occupied += s.occupied;
      revenue += s.revenue;
      chargesSum += s.charges;
    }
    const dim = daysInMonthArr(monthCursor).length;
    const totalSlots = dim * (apartments.length || 1);
    const occupancyRate = totalSlots ? (reserved + occupied) / totalSlots : 0;
    return {
      reserved,
      occupied,
      revenue,
      charges: chargesSum,
      net: revenue - chargesSum,
      occupancyRate,
    };
  }, [apartments, reservations, charges, monthCursor]);

  /* ------------------------------ Render cells ------------------------------ */
  const renderDayColumn = useCallback(
    ({ item: day }) => (
      <View style={[styles.dayColumn, { width: dayColWidth  }]}>
        <View style={[styles.headerCell, styles.dayHeaderCell]}>
          <Text style={styles.dayHeaderText}>
  {compact ? fmtDayTiny(day, locale) : fmtDayShort(day, locale)}
</Text>
        </View>
        {apartments.map((apt) => {
          const state = getCellState(apt.id, day);
          const bg =
            state.status === STATUS.FREE
              ? "#fff"
              : state.status === STATUS.RESERVED
              ? "#22c55e"
              : "#ef4444";
          const textColor = state.status === STATUS.FREE ? "#111827" : "#fff";
          return (
            <Pressable
              key={apt.id}
              onPress={() => openCreateOrEdit(apt.id, day)}
              style={[styles.rowCell, { backgroundColor: bg }]}
            >
              <Text numberOfLines={1} style={[styles.cellText, { color: textColor }]}>
                {state.label || "—"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ),
    [apartments, getCellState]
  );

  const getItemLayout = useCallback(
    (_d, index) => ({
      length: dayColWidth,
      offset: dayColWidth  * index,
      index,
    }),
    [dayColWidth]
  );

  const scrollToToday = () => {
    if (hListRef.current) {
      try {
        hListRef.current.scrollToIndex({
          index: todayIndex,
          animated: true,
        });
      } catch {}
    }
  };

  /* ---------------------------------- UI ---------------------------------- */
  return (
    <SafeAreaView style={[styles.container, { writingDirection: isRTL ? "rtl" : "ltr" }]}
  edges={["top", "left", "right"]}>
      {/* Top Tabs + gear */}
      <View style={styles.tabs}>
        {["timeline", "apartments"].map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key === "timeline" ? t("timeline") : t("apartments")}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={styles.settingsBtn}
          accessibilityLabel="Settings"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {tab === "timeline" ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.todayBtn} onPress={scrollToToday}>
                  <Text style={styles.todayBtnText}>{t("today")}</Text>
                </TouchableOpacity>

                <Pressable
                  onPress={() => setHistoryEnabled((v) => !v)}
                  style={[styles.tag, historyEnabled ? styles.tagOn : styles.tagOff]}
                >
                  <Text style={styles.tagText}>
                    {historyEnabled ? t("historyOn") : t("historyOff")}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <Legend color="#fff" label={t("free")} border />
              <Legend color="#22c55e" label={t("reserved")} />
              <Legend color="#ef4444" label={t("occupied")} />
            </View>
          </View>

          {/* Shared vertical scroll: LEFT (fixed names) + RIGHT (horizontal days) */}
          <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
            <View style={{ flexDirection: "row" }}>
              {/* LEFT fixed names column */}
              <View style={{ width: nameColWidth  }}>
                <View style={[styles.headerCell, styles.aptHeaderCell, { width: nameColWidth }]}>
                  <Text style={[styles.dayHeaderText, { fontWeight: "700" }]}>
                    {ultraCompact ? "apt" : t("apartment")}
                  </Text>
                </View>
                {apartments.map((apt) => (
                  <View key={apt.id} style={styles.rowCell}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.aptName}>
                      {apt.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* RIGHT horizontal days list */}
              <FlatList
                ref={hListRef}
                data={days}
                keyExtractor={(d) => d.toISOString()}
                renderItem={renderDayColumn}
                horizontal
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={Math.max(
                  0,
                  Math.min(todayIndex, (days?.length || 1) - 1)
                )}
                getItemLayout={getItemLayout}
                windowSize={7}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={16}
                removeClippedSubviews
              />
            </View>
          </ScrollView>
        </>
      ) : (
        /* ================= Apartments Screen ================= */
        <View style={{ flex: 1 }}>
          {/* Month summary header */}
          <View style={styles.aptsHeader}>
            <View style={styles.monthRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  setMonthCursor((prev) => {
                    const x = new Date(prev);
                    x.setMonth(x.getMonth() - 1);
                    return startOfMonth(x);
                  })
                }
              >
                <Text style={styles.secondaryBtnText}>{t("prev")}</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{fmtMonthYear(monthCursor)}</Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  setMonthCursor((prev) => {
                    const x = new Date(prev);
                    x.setMonth(x.getMonth() + 1);
                    return startOfMonth(x);
                  })
                }
              >
                <Text style={styles.secondaryBtnText}>{t("next")}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalsBar}>
              <SummaryPill label={t("revenue")} value={projectTotals.revenue} />
              <SummaryPill label={t("charges")} value={-projectTotals.charges} negative />
              <SummaryPill label={t("net")} value={projectTotals.net} bold />
              <View style={styles.occWrap}>
                <Text style={styles.occText}>
                  Occ: {(projectTotals.occupancyRate * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => openAptModal(null)}>
                <Text style={styles.primaryBtnText}>{t("addApartment")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Apartments list with month stats */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 12 }}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {apartments.map((apt) => {
              const s = computeMonthStatsForApt(apt.id, monthCursor);
              return (
                <View key={apt.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{apt.name}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Stat label={t("reserved")} value={s.reserved} />
                    <Stat label={t("occupied")} value={s.occupied} />
                    <Stat label={t("revenue")} value={s.revenue} money />
                    <Stat label={t("charges")} value={s.charges} money negative />
                    <Stat label={t("net")} value={s.net} money bold />
                  </View>
                  <View style={styles.actionsRow}>
  {/* Charges (red) + count badge */}
  <TouchableOpacity
    style={styles.actionBtn}
    onPress={() => openChargesManager(apt.id)}
  >
    <Text style={[styles.actionText]} numberOfLines={2} ellipsizeMode="tail">
      {t("charges")}
    </Text>
    
  </TouchableOpacity>

  {/* Edit */}
  <TouchableOpacity style={styles.actionBtn} onPress={() => openAptModal(apt)}>
    <Text style={styles.actionText} numberOfLines={2} ellipsizeMode="tail">
      {t("edit")}
    </Text>
  </TouchableOpacity>

  {/* Remove */}
  <TouchableOpacity
    style={[styles.actionBtn, styles.actionBtnDanger]}
    onPress={() => removeApartment(apt.id)}
  >
    <Text style={[styles.actionText, styles.actionTextDanger]} numberOfLines={2} ellipsizeMode="tail">
      {t("remove")}
    </Text>
  </TouchableOpacity>
</View>


                </View>
              );
            })}
            {apartments.length === 0 && (
              <Text style={{ textAlign: "center", opacity: 0.6, marginTop: 16 }}>
                No apartments yet. Tap “{t("addApartment")}”.
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* ===== Reservation Modal (Timeline) ===== */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={styles.modalTitle}>
                {editing?.resId ? t("edit") + " Reservation" : "New Reservation"}
              </Text>

              <Text style={styles.label}>{t("status")}</Text>
              <View style={styles.statusRow}>
                {[
                  { key: STATUS.RESERVED, label: t("reserved") },
                  { key: STATUS.OCCUPIED, label: t("occupied") },
                ].map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setForm((f) => ({ ...f, status: opt.key }))}
                    style={[styles.tag, form.status === opt.key ? styles.tagOn : styles.tagOff]}
                  >
                    <Text style={styles.tagText}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>{t("startDate")}</Text>
              <Pressable
                style={styles.dateBtn}
                onPress={() => {
                  if (Platform.OS === "ios") setShowIOSStart((v) => !v);
                  else setShowStartPicker(true);
                }}
              >
                <Text style={styles.dateBtnText}>{fmtDateLong(form.start)}</Text>
              </Pressable>
              {Platform.OS === "ios" && showIOSStart && (
  <View style={styles.pickerWrap}>
    <DateTimePicker
      value={form.start}
      mode="date"
      display="inline"
      themeVariant="light"         // iOS 14+; falls back internally
      onChange={(event, d) => {
        if (d) setForm((f) => ({ ...f, start: dateOnly(d) }));
         //if (event?.type !== "dismissed") {
         // requestAnimationFrame(() => setShowIOSEnd(false));
        //}
        setShowIOSStart(false)
      }}
    />
  </View>
)}

              <Text style={styles.label}>{t("endDate")}</Text>
              <Pressable
                style={styles.dateBtn}
                onPress={() => {
                  if (Platform.OS === "ios") setShowIOSEnd((v) => !v);
                  else setShowEndPicker(true);
                }}
              >
                <Text style={styles.dateBtnText}>{fmtDateLong(form.end)}</Text>
              </Pressable>
              {Platform.OS === "ios" && showIOSEnd && (
  <View style={styles.pickerWrap}>
    <DateTimePicker
      value={form.end}
      mode="date"
      display="inline"
      themeVariant="light"
      onChange={(event, d) => {
        if (d) setForm((f) => ({ ...f, end: dateOnly(d) }));
        //if (event?.type !== "dismissed") {
         // requestAnimationFrame(() => setShowIOSEnd(false));
        //}
        setShowIOSEnd(false)
      }}
    />
  </View>
)}

              <Text style={styles.label}>{t("guestName")}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., John Smith"
                value={form.guestName}
                onChangeText={(t) => setForm((f) => ({ ...f, guestName: t }))}
              />

              <Text style={styles.label}>{t("phone")}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 0612 34 56 78"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
              />

              <Text style={styles.label}>{t("cin")}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., K123456"
                autoCapitalize="characters"
                value={form.cin}
                onChangeText={(t) => setForm((f) => ({ ...f, cin: t }))}
              />

              <Text style={styles.label}>{t("pricePerDay")}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 400"
                keyboardType="numeric"
                value={form.pricePerDay}
                onChangeText={(t) => setForm((f) => ({ ...f, pricePerDay: t }))}
              />

              <Text style={styles.label}>{t("notes")}</Text>
              <TextInput
                style={[styles.input, { height: 72 }]}
                placeholder="e.g., paid deposit, arrives at 14:00"
                multiline
                value={form.notes}
                onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              {editing?.resId ? (
                <TouchableOpacity style={styles.dangerBtn} onPress={deleteReservation}>
                  <Text style={styles.dangerBtnText}>{t("remove")}</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setEditing(null);
                  }}
                >
                  <Text style={styles.secondaryBtnText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={saveReservation}>
                  <Text style={styles.primaryBtnText}>{t("save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Android inline pickers (Reservation) ===== */}
      {Platform.OS !== "ios" && showStartPicker && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={form.start}
            mode="date"
            display="inline"
            themeVariant="light"
            onChange={(_, d) => {
              setShowStartPicker(false);
              if (d) setForm((f) => ({ ...f, start: dateOnly(d) }));
            }}
          />
        </View>
      )}
      {Platform.OS !== "ios" && showEndPicker && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={form.end}
            mode="date"
            display="inline"
            onChange={(_, d) => {
              setShowEndPicker(false);
              if (d) setForm((f) => ({ ...f, end: dateOnly(d) }));
            }}
          />
        </View>
      )}

      {/* ===== Add/Edit Apartment Modal ===== */}
      <Modal visible={aptModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {aptEditing ? t("edit") + " Apartment" : t("addApartment")}
            </Text>
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Apartment name"
                value={aptForm.name}
                onChangeText={(t) => setAptForm((f) => ({ ...f, name: t }))}
              />
            </View>
            <View
              style={{
                marginTop: 12,
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAptModal(false)}>
                <Text style={styles.secondaryBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={saveApartment}>
                <Text style={styles.primaryBtnText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
 {/* ===== Charges Manager Modal ===== */}
{/* ===== Charges Manager Modal ===== */}
<Modal
  visible={chargesManagerOpen}
  animationType="slide"
  transparent
  presentationStyle="overFullScreen"
  onRequestClose={() => {setExpandedChargeId(null);setChargesManagerOpen(false)}}
>
  <View style={{ flex: 1 }}>
    {/* Backdrop */}
    <Pressable
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.35)" }]}
      onPress={() => setChargesManagerOpen(false)}
    />

    {/* Bottom sheet */}
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      style={styles.sheet}
    >
      <View style={[styles.modalCard, { maxHeight: "85%" }]}>
        {/* Header */}
<View style={{ marginBottom: 12 }}>
  <Text style={styles.modalTitle}>
    {t("charges")} — {apartments.find(a => a.id === chargesForApt)?.name || ""}
  </Text>

  {/* Add Charge button below title */}
  <TouchableOpacity
    style={[styles.primaryBtn, { marginTop: 8, alignSelf: "flex-start" }]}
    onPress={() => {
      setAddChargeForm({ date: dateOnly(new Date()), amount: "", note: "" });
      setShowIOSChargeAdd(false);
      setShowChargeAddPicker(false);
      setAddChargeOpen(true);
    }}
  >
    <Text style={styles.primaryBtnText}>{t("addCharge")}</Text>
  </TouchableOpacity>

  {/* Close button aligned to top-right */}
  <TouchableOpacity
    onPress={() => setChargesManagerOpen(false)}
    style={{ position: "absolute", right: 0, top: 0, padding: 8 }}
    hitSlop={12}
  >
    <Text style={{ fontWeight: "800", color: "#111827", fontSize: 18 }}>✕</Text>
  </TouchableOpacity>
</View>


        {/* Charges list */}
        <ScrollView
          style={{ flex: 1, marginTop: 12 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="always"
        >
          <Text style={[styles.modalTitle, { marginTop: 4 }]}>{t("charges")}</Text>

         {(charges[chargesForApt] || [])
  .slice()
  .sort((a, b) => (b.date || 0) - (a.date || 0))
  .map((c) => {
    const isOpen = expandedChargeId === c.id;
    return (
      <Pressable
        key={c.id}
        onPress={() => toggleChargeExpand(c.id)}
         style={styles.chargeRow}

      >
         {/* --- TOP ROW: date + chevron + amount + delete button --- */}
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
      <Text style={{ fontWeight: "800", color: "#111827" }}>
        {fmtDateLong(new Date(c.date), lang === "ar" ? "ar" : (lang === "fr" ? "fr" : "en"))}
      </Text>
      <Text style={{ color: "#6b7280", marginHorizontal: 8 }}>
        {isOpen ? "▾" : "▸"}
      </Text>
      <Text style={{ color: "#111827", fontWeight: "700", marginLeft: "auto" }}>
        {Number(c.amount || 0).toFixed(0)}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.dangerBtn}
      onPress={() => confirmDeleteCharge(c.id)}
    >
      <Text style={styles.dangerBtnText}>{t("remove")}</Text>
    </TouchableOpacity>
  </View>

  {/* --- NOTE BELOW (full width) --- */}
  {isOpen && (
    <View style={styles.noteBox}>
      <Text style={styles.noteText}>
        {c.note || "(No note)"}
      </Text>
    </View>
  )}

      </Pressable>
    );
  })}



          {(charges[chargesForApt] || []).length === 0 && (
            <Text style={{ textAlign: "center", color: "#6b7280", marginTop: 12 }}>
              No charges yet.
            </Text>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </View>
</Modal>

{/* ===== Add Charge Popup (center) ===== */}
{/* ===== Add Charge Popup (center) ===== */}
<Modal
  visible={addChargeOpen}
  transparent
  animationType="fade"
  presentationStyle="overFullScreen"
  onRequestClose={() => setAddChargeOpen(false)}
>
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    {/* Backdrop */}
    <Pressable
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
      onPress={() => setAddChargeOpen(false)}
    />

    {/* Center card */}
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      style={{
        width: "92%",
        maxWidth: 520,
        maxHeight: "75%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      {/* Title + Close */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.modalTitle}>
          {t("addCharge")} — {apartments.find(a => a.id === chargesForApt)?.name || ""}
        </Text>
        <TouchableOpacity onPress={() => setAddChargeOpen(false)} hitSlop={12}>
          <Text style={{ fontWeight: "800", color: "#111827", fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.formCard}>
          {/* Date */}
          <Text style={styles.label}>{t("date")}</Text>
          <Pressable
            style={styles.dateBtn}
            onPress={() => {
              Keyboard.dismiss();
              if (Platform.OS === "ios") setShowIOSChargeAdd(v => !v);
              else setShowChargeAddPicker(true);
            }}
          >
            <Text style={styles.dateBtnText}>
              {fmtDateLong(addChargeForm.date, lang === "ar" ? "ar" : (lang === "fr" ? "fr" : "en"))}
            </Text>
          </Pressable>

          {Platform.OS === "ios" && showIOSChargeAdd && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={addChargeForm.date}
                mode="date"
                display="inline"
                themeVariant="light"
                onChange={(event, d) => {
                  if (d) setAddChargeForm(f => ({ ...f, date: dateOnly(d) })); 
                  // auto-close after pick
                  if (event?.type !== "dismissed") requestAnimationFrame(() => setShowIOSChargeAdd(false));
                }}
              />
            </View>
          )}
          {Platform.OS !== "ios" && showChargeAddPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={addChargeForm.date}
                mode="date"
                display="inline"
                onChange={(_, d) => {
                  setShowChargeAddPicker(false);
                  if (d) setAddChargeForm(f => ({ ...f, date: dateOnly(d) }));
                }}
              />
            </View>
          )}

          {/* Amount */}
          <Text style={styles.label}>{t("amount")}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 120"
            keyboardType="numeric"
            value={addChargeForm.amount}
            onChangeText={(v) => setAddChargeForm(f => ({ ...f, amount: v }))}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          {/* Note */}
          <Text style={styles.label}>{t("noteOptional")}</Text>
          <TextInput
            style={[styles.input, { height: 120 }]}
            placeholder="e.g., Fixed AC"
            multiline
            value={addChargeForm.note}
            onChangeText={(v) => setAddChargeForm(f => ({ ...f, note: v }))}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            setShowIOSChargeAdd(false);
            setShowChargeAddPicker(false);
            setAddChargeOpen(false);
          }}
        >
          <Text style={styles.secondaryBtnText}>{t("cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { opacity: isFinite(parseFloat(addChargeForm.amount)) ? 1 : 0.5 }]}
          disabled={!isFinite(parseFloat(addChargeForm.amount))}
          onPress={async () => {
            const amountNum = parseFloat(addChargeForm.amount);
            if (!isFinite(amountNum)) {
              Alert.alert("Error", "Enter a valid amount");
              return;
            }
            try {
              await fsCreateCharge(chargesForApt, { ...addChargeForm, amount: amountNum });
              setAddChargeForm({ date: dateOnly(new Date()), amount: "", note: "" });
              setShowIOSChargeAdd(false);
              setShowChargeAddPicker(false);
              setAddChargeOpen(false);
            } catch (e) {
              Alert.alert("Error", (e?.message || "").toString());
            }
          }}
        >
          <Text style={styles.primaryBtnText}>{t("save")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </View>
</Modal>






       
   
      {/* ===== iOS bottom-sheet Date Picker ===== */}
      

      {/* ===== Settings Modal (gear) ===== */}
      <Modal visible={settingsOpen} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsOpen(false)}>
          <View />
        </Pressable>
        <View style={styles.settingsSheet}>
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            {/* Language */}
            <Text style={[styles.modalTitle, { marginBottom: 8 }]}>{t("language")}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setLang("fr")}
                style={[styles.tag, lang === "fr" ? styles.tagOn : styles.tagOff]}
              >
                <Text style={styles.tagText}>{t("french")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setLang("en")}
                style={[styles.tag, lang === "en" ? styles.tagOn : styles.tagOff]}
              >
                <Text style={styles.tagText}>{t("english")}</Text>
              </Pressable>
              <Pressable
    onPress={() => setLang("ar")}
    style={[styles.tag, lang === "ar" ? styles.tagOn : styles.tagOff]}
  >
    <Text style={styles.tagText}>{t("arabic")}</Text>
  </Pressable>
            </View>

            {/* About */}
            <Text style={[styles.modalTitle, { marginTop: 18 }]}>{t("aboutTitle")}</Text>
            <Text style={{ color: "#374151", marginTop: 6 }}>{t("aboutText")}</Text>
            <View style={styles.frainWrap}>
  <Text style={styles.poweredByText}>{t("poweredBy")}</Text>
  <View style={styles.frainBadge}>
    <Text style={[styles.frainBadgeText,  { borderWidth: 0 }]}>FRAIN</Text>
  </View>
 </View>
            

            {/* Logout */}
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  setSettingsOpen(false);
                  signOut(auth).catch(() => {});
                }}
              >
                <Text style={styles.logoutBtnText}>{t("logout")}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------------------ Small UI bits ------------------------------ */
const SummaryPill = ({ label, value, negative, bold }) => (
  <View style={[styles.pill, negative && styles.pillNegative]}>
    <Text style={[styles.pillLabel]}>{label}</Text>
    <Text style={[styles.pillValue, bold && { fontWeight: "800" }]}>
      {negative ? "-" : ""}
      {Number(value || 0).toFixed(0)}
    </Text>
  </View>
);
const Stat = ({ label, value, money, negative, bold }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text
      style={[
        styles.statValue,
        bold && { fontWeight: "800" },
        negative && { color: "#991b1b" },
      ]}
    >
      {money ? (negative ? "-" : "") : ""}
      {Number(value || 0).toFixed(0)}
    </Text>
  </View>
);
const Legend = ({ color, label, border = false }) => (
  <View style={styles.legendItem}>
    <View
      style={[
        styles.legendSwatch,
        { backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: "#ddd" },
      ]}
    />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

/* --------------------------------- Styles --------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  tabs: { flexDirection: "row", padding: 8, gap: 8, alignItems: "stretch" },
  tabBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
     height: 44, 
     minWidth: 0, 
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 0, 
    justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: "#111827" },
  tabText: { color: "#111827", fontWeight: "800" ,fontSize: 12,includeFontPadding: false, lineHeight: 16,         },
  tabTextActive: { color: "white" },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  settingsIcon: { fontSize: 20 },

  header: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },

  legendRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 18, height: 18, borderRadius: 4 },
  legendLabel: { color: "#374151", fontSize: 12 },

  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  tagOn: { backgroundColor: "#dbeafe", borderColor: "#93c5fd" },
  tagOff: { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" },
  tagText: { color: "#111827", fontWeight: "700", fontSize: 12 },

  todayBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  todayBtnText: { color: "white", fontWeight: "800" },

  headerCell: {
    height: HEADER_HEIGHT,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    paddingHorizontal: 8,
    margin: 4,
  },
  rowCell: {
    minHeight: ROW_HEIGHT,
    height: ROW_HEIGHT,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    paddingHorizontal: 8,
    margin: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  aptHeaderCell: { width: NAME_COL_WIDTH },
  aptName: { fontWeight: "700", color: "#111827", flexShrink: 1, fontSize: 12 },

  dayColumn: { flexDirection: "column" },
  dayHeaderCell: {},
  dayHeaderText: { fontWeight: "700", color: "#111827", textAlign: "center" },
  cellText: { fontSize: 12, fontWeight: "700", textAlign: "center" },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 10,
    maxHeight: "85%",
    zIndex: 1001,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  label: { fontWeight: "700", color: "#374151", marginTop: 6 },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 4 },

  dateBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  dateBtnText: { fontWeight: "700", color: "#111827" },

  modalActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: "white", fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryBtnText: { color: "#111827", fontWeight: "800" },
  dangerBtn: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dangerBtnText: { color: "#991b1b", fontWeight: "800" },
  actionsRow: {
  flexDirection: "row",
  gap: 8,
  marginTop: 8,
},

actionBtn: {
  flex: 1,          // equal width
  minWidth: 0,      // let text wrap instead of pushing width
  height: 48,       // a bit taller to allow 2 lines at same font size
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 8,
  backgroundColor: "#e5e7eb",
},

actionBtnDanger: {
  backgroundColor: "#fee2e2",
  borderWidth: 1,
  borderColor: "#fecaca",
},

actionText: {
  color: "#111827",
  fontWeight: "800",
  fontSize: 12,       // ← fixed size (no auto-shrink)
  lineHeight: 16,     // good readability for up to 2 lines
  textAlign: "center",
  includeFontPadding: false,
},

actionTextDanger: {
  color: "#991b1b",
},


  aptsHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  monthTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  totalsBar: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  pill: { backgroundColor: "#eef2ff", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  pillNegative: { backgroundColor: "#fee2e2" },
  pillLabel: { fontSize: 12, color: "#374151" },
  pillValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  occWrap: { justifyContent: "center", paddingHorizontal: 8 },
  occText: { fontWeight: "800", color: "#111827" },

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  priceText: { color: "#6b7280", fontWeight: "700" },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  statItem: { minWidth: 90 },
  statLabel: { color: "#6b7280", fontSize: 12 },
  statValue: { color: "#111827", fontWeight: "700", marginTop: 2 },

  pickerWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginTop: 6,
  },

  // iOS sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 12,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  zIndex: 1000,
},

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  // Settings sheet
  settingsSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  frainWrap: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 8,
  gap: 8,
},
poweredByText: {
  color: "#6b7280",
  fontStyle: "italic",
},
formCard: {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 12,
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
},

frainBadge: {
  paddingVertical: 2,
  paddingHorizontal: 8,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "#d1d5db",
  backgroundColor: "#fff",
},
sheet: {
  position: "absolute",
  left: 0, right: 0, bottom: 0,
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 12,            // choose 12 or 0, but only one definition
  borderWidth: 1,
  borderColor: "#e5e7eb",
},

frainBadgeText: {
  color: "#111827",
  fontWeight: "700",
  fontSize: 12,
  letterSpacing: 0.5,
  textTransform: "uppercase",
},

  logoutBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#fff",
    fontWeight: "800",
  },btnWithBadge: {
  position: "relative",
},
noteBox: {
  marginTop: 8,
  backgroundColor: "#f9fafb",
  borderRadius: 8,
  padding: 12,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  alignSelf: "stretch",
},
noteText: {
  color: "#374151",
  fontSize: 16,
  lineHeight: 22,
  flexShrink: 1,
  includeFontPadding: false,
},
chargeRow: {
  minHeight: 80,               // grows as needed
  borderWidth: 1,
  borderColor: "#e5e7eb",
  borderRadius: 16,
  backgroundColor: "#fff",
  marginVertical: 8,
  marginHorizontal: 4,
  padding: 12,
},

});
