import TrialPlansView from '@/components/english-pro/TrialPlansView';
import AllPlansView from '@/components/english-pro/AllPlansView';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const planRows = [
    { label: 'Các bài học', free: true, pro: true },
    { label: 'Năng lượng vô tận', free: false, pro: true },
    { label: 'Không quảng cáo', free: false, pro: true },
    { label: 'Luyện tập không giới hạn', free: false, pro: true },
    { label: 'Gỡ giới hạn Huyền thoại', free: false, pro: true },
];

function FeatureIcon({ available, accent = false }) {
    if (available) {
        return <Text style={[styles.featureIcon, accent && styles.featureIconAccent]}>✓</Text>;
    }

    return <Text style={styles.featureDash}>—</Text>;
}

export default function EnglishProScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cardWidth = Math.min(width - 24, 380);
    // 'intro' | 'trial' | 'allPlans'
    const [currentView, setCurrentView] = useState('intro');
    const [selectedPlan, setSelectedPlan] = useState('personal');
    const [selectedAllPlan, setSelectedAllPlan] = useState('personal-12');

    if (currentView === 'allPlans') {
        return (
            <AllPlansView
                selectedPlan={selectedAllPlan}
                onSelectPlan={setSelectedAllPlan}
                onGoBack={() => setCurrentView('trial')}
            />
        );
    }

    if (currentView === 'trial') {
        return (
            <TrialPlansView
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                onShowAllPlans={() => setCurrentView('allPlans')}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.topBar}>
                        <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={12} style={styles.closeButton}>
                            <Text style={styles.closeText}>×</Text>
                        </Pressable>

                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>SUPER</Text>
                        </View>
                    </View>

                    <View style={styles.heroTextWrap}>
                        <Text style={styles.heroTitle}>
                            Bạn sẽ có khả năng hoàn thành khóa
                        </Text>
                        <Text style={styles.heroTitle}>
                            học Tiếng Anh cao hơn <Text style={styles.highlight}>gấp 4.2 lần!</Text>
                        </Text>
                    </View>

                    <View style={styles.waveWrap}>
                        <View style={styles.waveBack} />
                        <View style={styles.waveFront} />
                        <View style={styles.waveCutOne} />
                        <View style={styles.waveCutTwo} />
                    </View>
                </View>

                <View style={[styles.card, { width: cardWidth }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderLabel}>MIỄN PHÍ</Text>
                        <View style={styles.smallBadge}>
                            <Text style={styles.smallBadgeText}>SUPER</Text>
                        </View>
                    </View>

                    <View style={styles.tableHeader}>
                        <View style={styles.featureColumn} />
                        <View style={styles.columnLabels}>
                            <Text style={styles.columnLabel}>FREE</Text>
                            <Text style={styles.columnLabelPro}>SUPER</Text>
                        </View>
                    </View>

                    {planRows.map((row) => (
                        <View key={row.label} style={styles.row}>
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <View style={styles.rowIcons}>
                                <FeatureIcon available={row.free} />
                                <FeatureIcon available={row.pro} accent />
                            </View>
                        </View>
                    ))}

                    <Pressable style={styles.ctaButton} onPress={() => setCurrentView('trial')}>
                        <Text style={styles.ctaText}>THỬ MỘT TUẦN MIỄN PHÍ</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#5b0f99',
    },
    scrollContent: {
        paddingBottom: 28,
        alignItems: 'center',
    },
    hero: {
        width: '100%',
        minHeight: 320,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 18,
        justifyContent: 'space-between',
        backgroundColor: '#5b0f99',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: '#fff',
        fontSize: 32,
        lineHeight: 32,
        marginTop: -4,
    },
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#4fd0ff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    heroTextWrap: {
        alignItems: 'center',
        paddingHorizontal: 8,
        marginTop: 12,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 26,
        lineHeight: 36,
        fontWeight: '800',
        textAlign: 'center',
    },
    highlight: {
        color: '#2cff74',
    },
    waveWrap: {
        height: 78,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    waveBack: {
        position: 'absolute',
        left: -25,
        right: -25,
        bottom: 0,
        height: 58,
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        backgroundColor: '#c9a0f2',
    },
    waveFront: {
        position: 'absolute',
        left: -18,
        right: -18,
        bottom: 0,
        height: 34,
        borderTopLeftRadius: 120,
        borderTopRightRadius: 120,
        backgroundColor: '#fff',
    },
    waveCutOne: {
        position: 'absolute',
        left: 36,
        bottom: 16,
        width: 110,
        height: 30,
        borderRadius: 40,
        backgroundColor: '#5b0f99',
        transform: [{ rotate: '-8deg' }],
    },
    waveCutTwo: {
        position: 'absolute',
        right: 18,
        bottom: 12,
        width: 140,
        height: 34,
        borderRadius: 50,
        backgroundColor: '#5b0f99',
        transform: [{ rotate: '6deg' }],
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 20,
        marginTop: 18,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    cardHeaderLabel: {
        fontSize: 15,
        fontWeight: '900',
        color: '#5b0f99',
    },
    smallBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#4fd0ff',
    },
    smallBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureColumn: {
        flex: 1,
    },
    columnLabels: {
        width: 128,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 8,
    },
    columnLabel: {
        width: 52,
        textAlign: 'center',
        color: '#5b0f99',
        fontWeight: '900',
        fontSize: 13,
    },
    columnLabelPro: {
        width: 60,
        textAlign: 'center',
        color: '#4fd0ff',
        fontWeight: '900',
        fontSize: 13,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
    },
    rowLabel: {
        flex: 1,
        color: '#4c4c4c',
        fontSize: 15,
        lineHeight: 21,
        paddingRight: 10,
    },
    rowIcons: {
        width: 128,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 8,
    },
    featureIcon: {
        width: 52,
        textAlign: 'center',
        color: '#9aa1b2',
        fontSize: 18,
        fontWeight: '900',
    },
    featureIconAccent: {
        color: '#246BFF',
    },
    featureDash: {
        width: 52,
        textAlign: 'center',
        color: '#c8c8c8',
        fontSize: 18,
        fontWeight: '700',
    },
    ctaButton: {
        marginTop: 18,
        backgroundColor: '#1f66ff',
        borderRadius: 16,
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    ctaText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.2,
        textAlign: 'center',
    },
});