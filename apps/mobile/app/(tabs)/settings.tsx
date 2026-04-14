import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import { api } from "@the-library/shared/convex/_generated/api";

export default function SettingsScreen() {
  const user = useQuery(api.users.viewer, {});
  const { signOut } = useAuthActions();
  const router = useRouter();

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Profile section */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name ?? "Loading..."}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.menuItemTextDanger}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>The Library v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f7",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#717977",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#c8e9e3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#032421",
  },
  profileName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1c1b",
  },
  profileEmail: {
    fontSize: 13,
    color: "#717977",
    marginTop: 2,
  },
  menuItem: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
  },
  menuItemTextDanger: {
    fontSize: 15,
    color: "#ba1a1a",
    fontWeight: "500",
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: "#717977",
  },
});
