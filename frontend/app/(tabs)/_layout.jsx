import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getHeartLabel = (user, nowMs) => {
    const hearts = user?.hearts ?? 0;
    const maxHearts = user?.maxHearts ?? 5;

    if (hearts >= maxHearts) {
        return "Đầy tim";
    }

    const nextHeartTime = user?.nextHeartAt
        ? new Date(user.nextHeartAt).getTime()
        : null;
    if (!nextHeartTime) {
        return "Đang hồi tim";
    }

    const minutes = Math.max(Math.ceil((nextHeartTime - nowMs) / 60000), 0);
    return minutes <= 0 ? "Sắp hồi tim" : `Tim tiếp theo: ${minutes} phút`;
};

export default function TabLayout() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [showHeartInfo, setShowHeartInfo] = useState(false);
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        if (!showHeartInfo) {
            return undefined;
        }

        setNowMs(Date.now());
        const timer = setInterval(() => setNowMs(Date.now()), 60000);
        return () => clearInterval(timer);
    }, [showHeartInfo]);

    const hearts = user?.hearts ?? 0;
    const maxHearts = user?.maxHearts ?? 5;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <SafeAreaView
                style={[
                    styles.header,
                    {
                        backgroundColor: theme.headerBg,
                        borderBottomColor: theme.border,
                    },
                ]}
            >
                <View style={styles.headerRow}>
                    <Text style={[styles.stat, { color: theme.text }]}>🇺🇸</Text>
                    <Text style={[styles.stat, { color: theme.text }]}>
                        🔥 {user?.streak || 0}
                    </Text>
                    <Text style={[styles.stat, { color: theme.text }]}>
                        💎 {user?.gems || 0}
                    </Text>
                    <Text
                        onPress={() => setShowHeartInfo((value) => !value)}
                        style={[
                            styles.stat,
                            styles.heartStat,
                            { color: theme.text },
                        ]}
                    >
                        ❤️ {hearts}/{maxHearts}
                    </Text>
                </View>
            </SafeAreaView>

            {showHeartInfo ? (
                <View pointerEvents="none" style={styles.heartBubbleOverlay}>
                    <View style={styles.heartBubble}>
                        <View style={styles.heartBubbleArrow} />
                        <Text style={styles.heartBubbleText}>
                            {getHeartLabel(user, nowMs)}
                        </Text>
                    </View>
                </View>
            ) : null}

            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#1cb0f6",
                    tabBarInactiveTintColor: theme.textSecondary,
                    tabBarStyle: [
                        styles.tabBar,
                        {
                            backgroundColor: theme.tabBarBg,
                            borderTopColor: theme.border,
                        },
                    ],
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: "Học tập",
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>📚</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="english-pro"
                    options={{
                        title: "English Pro",
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>⭐</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="leaderboard"
                    options={{
                        title: "Xếp hạng",
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>🏆</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Hồ sơ",
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>👤</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: "Cài đặt",
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>⚙️</Text>
                        ),
                    }}
                />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { borderBottomWidth: 2, zIndex: 30, elevation: 30 },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 10,
    },
    stat: { fontWeight: "bold", fontSize: 14 },
    heartStat: { minWidth: 54, textAlign: "center" },
    heartBubbleOverlay: {
        position: "absolute",
        top: 58,
        right: 10,
        zIndex: 100,
        elevation: 100,
    },
    heartBubble: {
        width: 126,
        borderRadius: 10,
        backgroundColor: "#3c3c3c",
        paddingHorizontal: 10,
        paddingVertical: 7,
        elevation: 100,
        marginTop: 20,
    },
    heartBubbleArrow: {
        position: "absolute",
        top: -5,
        left: "50%",
        marginLeft: 2,
        width: 10,
        height: 10,
        backgroundColor: "#3c3c3c",
        transform: [{ rotate: "45deg" }],
    },
    heartBubbleText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
    },
    tabBar: { height: 60, borderTopWidth: 2 },
});
