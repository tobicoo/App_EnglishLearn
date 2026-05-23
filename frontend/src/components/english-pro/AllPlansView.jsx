import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const allPlans = [
    {
        id: 'family-12',
        title: 'Gói gia đình',
        duration: '12 tháng',
        totalPrice: '899.000 đ',
        monthlyPrice: '74.916 đ / tháng',
        savings: 'Tiết kiệm 50%',
        members: 'Tối đa 6 thành viên',
        popular: false,
        paymentParams: { planName: 'Gia đình 12 tháng', price: '899.000 đ', period: 'năm', planKey: 'yearly' },
    },
    {
        id: 'personal-12',
        title: 'Cá nhân',
        duration: '12 tháng',
        totalPrice: '689.000 đ',
        monthlyPrice: '57.416 đ / tháng',
        savings: 'Tiết kiệm 60%',
        members: null,
        popular: true,
        paymentParams: { planName: 'Cá nhân 12 tháng', price: '689.000 đ', period: 'năm', planKey: 'yearly' },
    },
    {
        id: 'personal-6',
        title: 'Cá nhân',
        duration: '6 tháng',
        totalPrice: '449.000 đ',
        monthlyPrice: '74.833 đ / tháng',
        savings: 'Tiết kiệm 40%',
        members: null,
        popular: false,
        paymentParams: { planName: 'Cá nhân 6 tháng', price: '449.000 đ', period: 'năm', planKey: 'yearly' },
    },
    {
        id: 'personal-1',
        title: 'Cá nhân',
        duration: '1 tháng',
        totalPrice: '129.000 đ',
        monthlyPrice: '129.000 đ / tháng',
        savings: null,
        members: null,
        popular: false,
        paymentParams: { planName: 'Cá nhân 1 tháng', price: '129.000 đ', period: 'tháng', planKey: 'monthly' },
    },
];

const features = [
    { icon: '♾️', text: 'Năng lượng vô tận' },
    { icon: '🚫', text: 'Không quảng cáo' },
    { icon: '🏋️', text: 'Luyện tập không giới hạn' },
    { icon: '🏆', text: 'Gỡ giới hạn Huyền thoại' },
    { icon: '📊', text: 'Theo dõi tiến độ nâng cao' },
];

export default function AllPlansView({ selectedPlan, onSelectPlan, onGoBack }) {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <Pressable onPress={onGoBack} hitSlop={12} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>SUPER</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>Chọn gói phù hợp với bạn</Text>
                    <Text style={styles.headerSub}>Tất cả các gói đều bao gồm dùng thử 7 ngày miễn phí</Text>
                </View>

                {/* Plans List */}
                <View style={styles.plansList}>
                    {allPlans.map((plan) => {
                        const isSelected = plan.id === selectedPlan;

                        return (
                            <Pressable
                                key={plan.id}
                                style={[
                                    styles.planCard,
                                    isSelected ? styles.planCardSelected : styles.planCardDefault,
                                ]}
                                onPress={() => onSelectPlan(plan.id)}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <View style={styles.popularPill}>
                                        <Text style={styles.popularPillText}>PHỔ BIẾN</Text>
                                    </View>
                                )}

                                <View style={styles.planCardContent}>
                                    <View style={styles.planLeft}>
                                        {/* Radio Circle */}
                                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>

                                        <View style={styles.planTextWrap}>
                                            <View style={styles.planTitleRow}>
                                                <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
                                                    {plan.title}
                                                </Text>
                                                {plan.members && (
                                                    <View style={styles.membersBadge}>
                                                        <Text style={styles.membersBadgeText}>👨‍👩‍👧‍👦</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.planDuration}>{plan.duration} • {plan.totalPrice}</Text>
                                            {plan.members && (
                                                <Text style={styles.planMembers}>{plan.members}</Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.planRight}>
                                        <Text style={[styles.planMonthly, isSelected && styles.planMonthlySelected]}>
                                            {plan.monthlyPrice}
                                        </Text>
                                        {plan.savings && (
                                            <View style={styles.savingsBadge}>
                                                <Text style={styles.savingsText}>{plan.savings}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <Text style={styles.featuresTitle}>Tất cả gói Super bao gồm:</Text>
                    {features.map((feat) => (
                        <View key={feat.text} style={styles.featureRow}>
                            <Text style={styles.featureIcon}>{feat.icon}</Text>
                            <Text style={styles.featureText}>{feat.text}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View style={styles.bottomCta}>
                <Pressable
                    style={styles.ctaButton}
                    onPress={() => {
                        const plan = allPlans.find((p) => p.id === selectedPlan) ?? allPlans[1];
                        router.push({ pathname: '/payment', params: plan.paymentParams });
                    }}
                >
                    <Text style={styles.ctaButtonText}>BẮT ĐẦU DÙNG THỬ MIỄN PHÍ</Text>
                </Pressable>
                <Text style={styles.ctaSubtext}>Hủy bất kỳ lúc nào. Không rủi ro.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#5b0f99',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '600',
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
    scrollContent: {
        paddingBottom: 24,
    },
    headerSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 24,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    headerSub: {
        color: '#c9a0f2',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    plansList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    planCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        position: 'relative',
        overflow: 'visible',
    },
    planCardDefault: {
        backgroundColor: '#4f1b93',
        borderColor: '#6944d5',
    },
    planCardSelected: {
        backgroundColor: '#7a2cf0',
        borderColor: '#25c4ff',
        shadowColor: '#25c4ff',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    popularPill: {
        position: 'absolute',
        top: -11,
        left: 16,
        backgroundColor: '#19d7ef',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 3,
        zIndex: 2,
    },
    popularPillText: {
        color: '#003d66',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    planCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    planLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#8a6bc0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#25c4ff',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#25c4ff',
    },
    planTextWrap: {
        flex: 1,
    },
    planTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    planTitle: {
        color: '#ddd',
        fontSize: 16,
        fontWeight: '800',
    },
    planTitleSelected: {
        color: '#fff',
    },
    membersBadge: {
        fontSize: 14,
    },
    membersBadgeText: {
        fontSize: 14,
    },
    planDuration: {
        color: '#b8a0d8',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 3,
    },
    planMembers: {
        color: '#c9a0f2',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    planRight: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    planMonthly: {
        color: '#c9a0f2',
        fontSize: 13,
        fontWeight: '800',
    },
    planMonthlySelected: {
        color: '#fff',
    },
    savingsBadge: {
        backgroundColor: '#2cff7433',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 4,
    },
    savingsText: {
        color: '#2cff74',
        fontSize: 11,
        fontWeight: '800',
    },
    featuresSection: {
        marginTop: 28,
        paddingHorizontal: 20,
        backgroundColor: '#4a1088',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
    },
    featuresTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#5b2098',
    },
    featureIcon: {
        fontSize: 20,
        width: 28,
        textAlign: 'center',
    },
    featureText: {
        color: '#e0d0f5',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    bottomCta: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: '#5b0f99',
        borderTopWidth: 1,
        borderTopColor: '#7a3db8',
    },
    ctaButton: {
        width: '100%',
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: '#1f66ff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        shadowColor: '#1f66ff',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    ctaSubtext: {
        color: '#b8a0d8',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
    },
});
