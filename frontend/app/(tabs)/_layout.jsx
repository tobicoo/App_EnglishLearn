import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getHeartLabel = (user, nowMs, t) => {
    const hearts = user?.hearts ?? 0;
    const maxHearts = user?.maxHearts ?? 5;

    if (hearts >= maxHearts) {
        return t('hearts_full');
    }

    const nextHeartTime = user?.nextHeartAt
        ? new Date(user.nextHeartAt).getTime()
        : null;
    if (!nextHeartTime) {
        return t('hearts_refilling');
    }

    const minutes = Math.max(Math.ceil((nextHeartTime - nowMs) / 60000), 0);
    return minutes <= 0 ? t('hearts_almost') : t('hearts_next', { n: minutes });
};

export default function TabLayout() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useLanguage();
    const router = useRouter();
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

    useEffect(() => {
        const onBackPress = () => true;
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, []);

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
                    <TouchableOpacity onPress={() => setShowHeartInfo((value) => !value)}>
                        <Text style={[styles.stat, styles.heartStat, { color: theme.text }]}>
                            ❤️ {hearts}/{maxHearts}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn}>
                        <Text style={styles.bellIcon}>🔔</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {showHeartInfo ? (
                <View pointerEvents="none" style={styles.heartBubbleOverlay}>
                    <View style={styles.heartBubble}>
                        <View style={styles.heartBubbleArrow} />
                        <Text style={styles.heartBubbleText}>
                            {getHeartLabel(user, nowMs, t)}
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
                        title: t('tab_study'),
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>📚</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="english-pro"
                    options={{
                        title: t('tab_english_pro'),
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>⭐</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="leaderboard"
                    options={{
                        title: t('tab_leaderboard'),
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>🏆</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: t('tab_profile'),
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>👤</Text>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: t('tab_menu'),
                        tabBarIcon: () => (
                            <Text style={{ fontSize: 20 }}>☰</Text>
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
    bellBtn: { paddingHorizontal: 6 },
    bellIcon: { fontSize: 20 },
});
