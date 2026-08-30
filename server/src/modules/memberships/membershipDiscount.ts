import { prisma } from '../../config/database';

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Fetch the active membership for a client (status=ACTIVE and not expired).
 */
export async function getActiveMembership(clientId: number) {
  const now = new Date();
  return prisma.clientMembership.findFirst({
    where: {
      clientId,
      status: 'ACTIVE',
      endDate: { gte: now },
    },
    include: { plan: true },
  });
}

export interface MembershipDiscountResult {
  discount: number;
  membershipPlanId: number | null;
  membershipPlanName: string | null;
  discountPercent: number;
}

/**
 * Compute the membership discount for an invoice.
 *
 * - If the plan has no serviceIds (empty array), the discount applies to the entire subtotal.
 * - If the plan has specific serviceIds, the discount applies only to the covered services' total.
 *
 * @param clientId     The client ID
 * @param subtotal     The invoice subtotal
 * @param serviceIds   The service IDs in the invoice
 * @param servicePrices Map of serviceId → line total (price × quantity) for covered services
 */
export async function computeMembershipDiscount(
  clientId: number,
  subtotal: number,
  serviceIds: number[],
  servicePrices: Map<number, number>,
): Promise<MembershipDiscountResult> {
  const membership = await getActiveMembership(clientId);
  if (!membership) {
    return { discount: 0, membershipPlanId: null, membershipPlanName: null, discountPercent: 0 };
  }

  const pct = Number(membership.plan.discountPercent) || 0;
  if (pct <= 0) {
    return { discount: 0, membershipPlanId: membership.planId, membershipPlanName: membership.plan.nameAr, discountPercent: 0 };
  }

  // No specific services → discount on entire subtotal
  if (!membership.plan.serviceIds || membership.plan.serviceIds.length === 0) {
    return {
      discount: round2((subtotal * pct) / 100),
      membershipPlanId: membership.planId,
      membershipPlanName: membership.plan.nameAr,
      discountPercent: pct,
    };
  }

  // Specific services → discount only on covered services' total
  const coveredTotal = serviceIds
    .filter((id) => membership.plan.serviceIds.includes(id))
    .reduce((sum, id) => sum + (servicePrices.get(id) ?? 0), 0);

  return {
    discount: round2((coveredTotal * pct) / 100),
    membershipPlanId: membership.planId,
    membershipPlanName: membership.plan.nameAr,
    discountPercent: pct,
  };
}
