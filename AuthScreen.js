import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform
} from "react-native";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

// ---- Your OAuth Client IDs
const WEB_ID     = "616268227395-p9srvisjsul965loqos40i6evb5cs5s2.apps.googleusercontent.com";
const IOS_ID     = "616268227395-cr0a7dqv65i2groprvpa6cdljnp85ftp.apps.googleusercontent.com";
const ANDROID_ID = "616268227395-buobebc2m555r75pbfamikl4kvgmhhik.apps.googleusercontent.com";

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
    default:
      return t("errGeneric");
  }
};

export default function AuthScreen({ onAuthed, t }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isExpoGo = Constants.appOwnership === "expo";
  const platformId = Platform.OS === "ios" ? IOS_ID : ANDROID_ID;

  // Redirect URI
  const redirectUri = useMemo(() => {
    if (isExpoGo) return makeRedirectUri({ useProxy: true });
    return makeRedirectUri({ scheme: "homeday", path: "oauthredirect" });
  }, [isExpoGo, platformId]);

  // Stable config for the hook
  const googleCfg = useMemo(
    () =>
      isExpoGo
        ? {
            expoClientId: WEB_ID,
            webClientId: WEB_ID,
            iosClientId: IOS_ID,
            androidClientId: ANDROID_ID,
            useProxy: true,
            redirectUri,
          }
        : {
            expoClientId: WEB_ID,   // harmless in native builds
            webClientId: WEB_ID,
            iosClientId: IOS_ID,
            androidClientId: ANDROID_ID,
            useProxy: false,
            redirectUri,
          },
    [isExpoGo, redirectUri]
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleCfg);
  const [cooldown, setCooldown] = useState(0);
const startCooldown = (sec = 60) => {
  setCooldown(sec);
  const id = setInterval(() => {
    setCooldown((s) => {
      if (s <= 1) { clearInterval(id); return 0; }
      return s - 1;
    });
  }, 1000);
};
  useEffect(() => {
    const handle = async () => {
      if (response?.type !== "success") return;
      try {
        setGoogleLoading(true);
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const cred = await signInWithCredential(auth, credential);
        onAuthed?.(cred.user);
      } catch (e) {
        Alert.alert(t("login Failed") || "Login Failed", mapAuthError(e, t));
      } finally {
        setGoogleLoading(false);
      }
    };
    handle();
  }, [response, onAuthed, t]);
const onForgotPass = async () => {
  try {
    const mail = (email || "").trim();
    if (!mail) return Alert.alert(t("emailRequired"));
    try { auth.useDeviceLanguage?.(); } catch {}
    await sendPasswordResetEmail(auth, mail);
    Alert.alert(
       t("resetEmailSentTitle"),
  t("resetEmailSentBody") + "\n\n" + (t("checkSpamBody") || "")
    );
  } catch (e) {
    // Pendant le debug, montrez l’erreur brute :
    Alert.alert(
      t("resetFailedTitle") || "Échec de la réinitialisation",
      `${e.code || ""} ${e.message || ""}`
    );
  }
};
  const submit = async () => {
    try {
      if (!email.trim()) return Alert.alert(t("emailRequired") || "Email required");
      if (pass.length < 6) return Alert.alert(t("passMin"));
      setLoading(true);
      const cred = isLogin
        ? await signInWithEmailAndPassword(auth, email.trim(), pass)
        : await createUserWithEmailAndPassword(auth, email.trim(), pass);
      onAuthed?.(cred.user);
    } catch (e) {
      Alert.alert(t("login Failed") || "Login Failed", mapAuthError(e, t));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      await promptAsync({ useProxy: isExpoGo, showInRecents: true });
    } catch (e) {
      Alert.alert(t("googleSigninFailedTitle"), mapAuthError(e, t));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 24 }}>
      <View style={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Image
            source={require("./assets/iconHomeday.png")}
            style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 12 }}
            resizeMode="contain"
          />
        </View>
        <Text style={{ marginTop: 12, fontWeight: "700", color: "#111827" }}>
          {t("emailLabel")}
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
         {t("passwordLabel")}
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
              {showPass ? t("hide") : t("show")}
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
             {isLogin ? t("login") : t("signup")}
            </Text>
          )}
        </TouchableOpacity>
          <TouchableOpacity onPress={onForgotPass} style={{ marginTop: 8, alignSelf: "center" }}>
  <Text style={{ color: "#0ea5e9", fontWeight: "700" }}>
   {t("forgotPassword")}
  </Text>
</TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(v => !v)}
          style={{ marginTop: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#0ea5e9", fontWeight: "700" }}>
           {isLogin ? t("createAccountCta") : t("haveAccountCta")}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 14 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
          <Text style={{ marginHorizontal: 8, color: "#6b7280" }}>{t("or")}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
        </View>

        <TouchableOpacity
          onPress={signInWithGoogle}
          disabled={!request || googleLoading}
          style={{
            backgroundColor: "#fff",
            borderColor: "#e5e7eb",
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            opacity: !request || googleLoading ? 0.6 : 1,
          }}
        >
          {googleLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ fontWeight: "800", color: "#111827" }}>
              {t("continueWithGoogle")}
            </Text>
          )}
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
