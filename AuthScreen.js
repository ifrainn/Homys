import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform
} from "react-native";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import {
  collection, doc, setDoc, getDocs, query, where, serverTimestamp
} from "firebase/firestore";

const mapAuthError = (error, t) => {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return t("errInvalidCredentials");
    case "auth/user-not-found":
      return t("errUserNotFound");
    case "auth/too-many-requests":
      return t("errTooManyRequests");
    case "auth/network-request-failed":
      return t("errNetwork");
    case "auth/email-already-in-use":
      return t("errEmailInUse");
    default:
      return t("errGeneric");
  }
};

const normalizePhone = (raw) => {
  const s = (raw || "").replace(/\s+/g, "");
  if (/^0\d{9}$/.test(s)) return "+212" + s.slice(1);
  if (/^\+\d{6,}$/.test(s)) return s;
  return s;
};

const looksLikeEmail = (v) => v.includes("@");

export default function AuthScreen({ onAuthed, t }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ----------- LOGIN (email ou phone + password) ------------
  const signInWithEmailOrPhone = async () => {
    const id = (emailOrPhone || "").trim();
    if (!id) {
      return Alert.alert(t("emailOrPhoneRequired") || "Email or phone required");
    }
    if (pass.length < 6) {
      return Alert.alert(t("passMin") || "Password too short (min 6)");
    }

    try {
      setLoading(true);
      if (looksLikeEmail(id)) {
        const cred = await signInWithEmailAndPassword(auth, id, pass);
        onAuthed?.(cred.user);
        return;
      }

      const phoneNorm = normalizePhone(id);
      const q = query(collection(db, "users"), where("phone", "==", phoneNorm));
      const snap = await getDocs(q);
      if (snap.empty) {
        return Alert.alert(
          t("loginFailedTitle") || "Login Failed",
          t("errUserNotFound") || "User not found for this phone number"
        );
      }
      const userDoc = snap.docs[0].data();
      const emailFromPhone = userDoc?.email;
      if (!emailFromPhone) {
        return Alert.alert(
          t("loginFailedTitle") || "Login Failed",
          t("errNoEmailLinked") || "No email linked to this phone number"
        );
      }
      const cred = await signInWithEmailAndPassword(auth, emailFromPhone, pass);
      onAuthed?.(cred.user);
    } catch (e) {
      Alert.alert(t("loginFailedTitle") || "Login Failed", mapAuthError(e, t));
    } finally {
      setLoading(false);
    }
  };

  // ----------- SIGNUP (email + phone + password) ------------
  const signUp = async () => {
    const em = (email || "").trim();
    const ph = normalizePhone(phone);
    if (!em) return Alert.alert(t("emailRequired") || "Email required");
    if (!ph) return Alert.alert(t("phoneRequired") || "Phone required");
    if (pass.length < 6) return Alert.alert(t("passMin") || "Password too short (min 6)");

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, em, pass);
      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: em,
        phone: ph,
        createdAt: serverTimestamp(),
        platform: Platform.OS,
      }, { merge: true });

      onAuthed?.(cred.user);
    } catch (e) {
      Alert.alert(t("signupFailedTitle") || "Signup Failed", mapAuthError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (isLogin) return signInWithEmailOrPhone();
    return signUp();
  };

  // ----------- MOT DE PASSE OUBLIÉ ------------
  const onForgotPass = async () => {
    try {
      const mail = (emailOrPhone || "").trim();
      if (!mail || !looksLikeEmail(mail)) {
        return Alert.alert(t("emailRequired") || "Enter your email to reset password");
      }
      await sendPasswordResetEmail(auth, mail);
      Alert.alert(
        t("resetEmailSentTitle") || "Reset email sent",
        (t("resetEmailSentBody") || "Please check your inbox.") +
          "\n\n" +
          (t("checkSpamBody") || "Check also your spam folder.")
      );
    } catch (e) {
      Alert.alert(
        t("resetFailedTitle") || "Reset failed",
        `${e.code || ""} ${e.message || ""}`
      );
    }
  };

  // ----------- UI ------------
  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 24 }}>
      <View style={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Image
            source={require("./assets/iconHomys.png")}
            style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 12 }}
            resizeMode="contain"
          />
        </View>

        {isLogin ? (
          <>
            <Text style={{ marginTop: 12, fontWeight: "700", color: "#111827" }}>
              {t("emailOrPhoneLabel") || "Email or phone"}
            </Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="you@example.com  •  +2126XXXXXXXX"
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            />
          </>
        ) : (
          <>
            <Text style={{ marginTop: 12, fontWeight: "700", color: "#111827" }}>
              {t("emailLabel") || "Email"}
            </Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            />

            <Text style={{ marginTop: 12, fontWeight: "700", color: "#111827" }}>
              {t("phoneLabel") || "Phone"}
            </Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholder="+2126XXXXXXXX"
              style={{
                marginTop: 6,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            />
          </>
        )}

        <Text style={{ marginTop: 12, fontWeight: "700", color: "#111827" }}>
          {t("passwordLabel") || "Password"}
        </Text>
        <View
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "#fff",
            borderRadius: 12,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextInput
            style={{ flex: 1, paddingVertical: 12 }}
            secureTextEntry={!showPass}
            value={pass}
            onChangeText={setPass}
            placeholder="********"
          />
          <TouchableOpacity onPress={() => setShowPass(s => !s)} style={{ padding: 8 }}>
            <Text style={{ color: "#0ea5e9", fontWeight: "700" }}>
              {showPass ? (t("hide") || "Hide") : (t("show") || "Show")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          style={{
            marginTop: 16,
            backgroundColor: "#0ea5e9",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {isLogin ? (t("login") || "Log in") : (t("signup") || "Sign up")}
            </Text>
          )}
        </TouchableOpacity>

        {isLogin && (
          <TouchableOpacity onPress={onForgotPass} style={{ marginTop: 8, alignSelf: "center" }}>
            <Text style={{ color: "#0ea5e9", fontWeight: "700" }}>
              {t("forgotPassword") || "Forgot password?"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setIsLogin(v => !v)}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#0ea5e9", fontWeight: "700" }}>
            {isLogin
              ? (t("createAccountCta") || "Create an account")
              : (t("haveAccountCta") || "I already have an account")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "center", paddingVertical: 12 }}>
        <Text style={{ color: "#9ca3af", fontWeight: "700" }}>
          {t("poweredBy") || "Powered by"} <Text style={{ color: "#111827" }}>FRAIN</Text>
        </Text>
      </View>
    </View>
  );
}
