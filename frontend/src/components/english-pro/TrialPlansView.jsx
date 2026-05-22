import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const trialPlans = [
    {
        id: 'family',
        title: 'Gói gia đình',
        subtitle: '12 th • 899.000 đ',
        price: '74.916,67 đ / THÁNG',
        popular: false,
    },
    {
        id: 'personal',
        title: 'Cá nhân',
        subtitle: '12 th • 689.000 đ',
        price: '57.416,67 đ / THÁNG',
        popular: true,
    },
];

export default function TrialPlansView({ selectedPlan, onSelectPlan, onShowAllPlans }) {
    const router = useRouter();
    const orderedPlans = trialPlans;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.trialHero}>
                    <View style={styles.topBar}>
                        <Pressable onPress={() => router.replace('/home')} hitSlop={12} style={styles.closeButton}>
                            <Text style={styles.closeText}>×</Text>
                        </Pressable>

                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>SUPER</Text>
                        </View>
                    </View>

                    <View style={styles.trialHeroTextWrap}>
                        <Text style={styles.trialHeroTitle}>Học không ngừng nghỉ.</Text>
                        <Text style={styles.trialHeroTitle}>
                            <Text style={styles.highlight}>Hãy dùng thử 7 ngày miễn</Text>
                        </Text>
                        <Text style={styles.trialHeroTitle}>
                            <Text style={styles.highlight}>phí.</Text>
                        </Text>
                    </View>

                    <View style={styles.planStack}>
                        {orderedPlans.map((plan) => {
                            const isSelected = plan.id === selectedPlan;

                            return (
                                <Pressable
                                    key={plan.id}
                                    style={[styles.planCard, isSelected ? styles.planCardAccent : styles.planCardMuted]}
                                    onPress={() => onSelectPlan(plan.id)}
                                >
                                    {plan.popular && (
                                        <View style={styles.planPill}>
                                            <Text style={styles.planPillText}>PHỔ BIẾN</Text>
                                        </View>
                                    )}

                                    <View style={styles.planCardRow}>
                                        <View style={styles.planInfo}>
                                            <Text style={styles.planTitle}>{plan.title}</Text>
                                            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                                        </View>

                                        <View style={styles.planPriceWrap}>
                                            <Text style={styles.planPrice}>{plan.price}</Text>
                                        </View>
                                    </View>

                                    {isSelected ? (
                                        <View style={styles.selectedBubble}>
                                            <Text style={styles.selectedBubbleText}>✓</Text>
                                        </View>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.trialFooterCard}>
                    <View style={styles.waveWrapTrial}>
                        <View style={styles.waveBackTrial} />
                        <View style={styles.waveFrontTrial} />
                        <View style={styles.waveCutLeftTrial} />
                        <View style={styles.waveCutRightTrial} />
                    </View>

                    <Text style={styles.cancelText}>Hủy bất kỳ lúc nào trong App Store</Text>

                    <Pressable style={styles.primaryTrialButton} onPress={() => { }}>
                        <Text style={styles.primaryTrialButtonText}>
                            {selectedPlan === 'family' ? 'DÙNG THỬ GÓI GIA ĐÌNH VỚI GIÁ 0 đ' : 'DÙNG THỬ GÓI CÁ NHÂN VỚI GIÁ 0 đ'}
                        </Text>
                    </Pressable>

                    <Pressable onPress={onShowAllPlans} hitSlop={12}>
                        <Text style={styles.secondaryLink}>XEM TẤT CẢ CÁC GÓI</Text>
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
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    trialHero: {
        width: '100%',
        minHeight: 430,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 18,
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
    trialHeroTextWrap: {
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 18,
        paddingHorizontal: 6,
    },
    trialHeroTitle: {
        color: '#fff',
        fontSize: 26,
        lineHeight: 36,
        fontWeight: '800',
        textAlign: 'center',
    },
    highlight: {
        color: '#2cff74',
    },
    planStack: {
        marginTop: 8,
        gap: 14,
    },
    planCard: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        minHeight: 104,
        borderWidth: 1.5,
        position: 'relative',
    },
    planCardMuted: {
        backgroundColor: '#4f1b93',
        borderColor: '#6944d5',
    },
    planCardAccent: {
        backgroundColor: '#8a39f7',
        borderColor: '#25c4ff',
        shadowColor: '#25c4ff',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    planPill: {
        position: 'absolute',
        top: -10,
        left: 14,
        backgroundColor: '#19d7ef',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 3,
        zIndex: 2,
    },
    planPillText: {
        color: '#003d66',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.2,
    },
    planCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    planInfo: {
        flex: 1,
        paddingRight: 10,
    },
    planTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    planSubtitle: {
        color: '#eadfff',
        fontSize: 13,
        fontWeight: '600',
    },
    planPriceWrap: {
        alignItems: 'flex-end',
        maxWidth: 132,
    },
    planPrice: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'right',
    },
    selectedBubble: {
        position: 'absolute',
        right: -6,
        top: 16,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#19d7ef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedBubbleText: {
        color: '#003d66',
        fontSize: 16,
        fontWeight: '900',
    },
    trialFooterCard: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 0,
        paddingBottom: 22,
        justifyContent: 'flex-end',
    },
    waveWrapTrial: {
        width: '100%',
        height: 86,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginTop: -10,
    },
    waveBackTrial: {
        position: 'absolute',
        left: -20,
        right: -20,
        bottom: 0,
        height: 60,
        borderTopLeftRadius: 120,
        borderTopRightRadius: 120,
        backgroundColor: '#e9ddfb',
    },
    waveFrontTrial: {
        position: 'absolute',
        left: -12,
        right: -12,
        bottom: 0,
        height: 38,
        borderTopLeftRadius: 120,
        borderTopRightRadius: 120,
        backgroundColor: '#fff',
    },
    waveCutLeftTrial: {
        position: 'absolute',
        left: -6,
        bottom: 12,
        width: 116,
        height: 42,
        borderRadius: 50,
        backgroundColor: '#5b0f99',
        transform: [{ rotate: '-4deg' }],
    },
    waveCutRightTrial: {
        position: 'absolute',
        right: -8,
        bottom: 10,
        width: 120,
        height: 46,
        borderRadius: 50,
        backgroundColor: '#5b0f99',
        transform: [{ rotate: '8deg' }],
    },
    cancelText: {
        marginTop: 8,
        marginBottom: 16,
        color: '#6f6f6f',
        fontSize: 13,
        textAlign: 'center',
    },
    primaryTrialButton: {
        width: '100%',
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: '#1f66ff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        shadowColor: '#1f66ff',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    primaryTrialButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
        textAlign: 'center',
    },
    secondaryLink: {
        marginTop: 20,
        color: '#1f66ff',
        fontSize: 15,
        fontWeight: '900',
        textAlign: 'center',
    },
});