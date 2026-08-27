export type MasterData = {
  id: string;
  salary_base: number;
  salary_per_sale: number;
};

export type ShiftResult = {
  total_sales: number;
  first_master_sales: number;
  second_master_sales: number;
  first_master_salary: number;
  second_master_salary: number;
  first_master_shift_coefficient: number;
  second_master_shift_coefficient: number | null;
};

export function calculateSales(hookahs: number, replacements: number): number {
  return hookahs + replacements;
}

export function distributeSales(totalSales: number, isSolo: boolean) {
  if (isSolo) {
    return {
      firstMasterSales: totalSales,
      secondMasterSales: 0,
    };
  }

  const secondMasterSales = Math.floor(totalSales / 2);
  const firstMasterSales = totalSales - secondMasterSales;

  return { firstMasterSales, secondMasterSales };
}

export function calculateSalary(
  baseSalary: number,
  ratePerSale: number,
  salesCount: number,
  isSecondMaster: boolean
): number {
  const actualBase = isSecondMaster ? baseSalary / 2 : baseSalary;
  return actualBase + salesCount * ratePerSale;
}

export function processShiftData(
  hookahs: number,
  replacements: number,
  firstMaster: MasterData,
  secondMaster: MasterData | null
): ShiftResult {
  const isSolo = secondMaster === null;
  const totalSales = calculateSales(hookahs, replacements);
  const { firstMasterSales, secondMasterSales } = distributeSales(totalSales, isSolo);

  const firstMasterSalary = calculateSalary(
    firstMaster.salary_base,
    firstMaster.salary_per_sale,
    firstMasterSales,
    false
  );

  let secondMasterSalary = 0;
  if (!isSolo && secondMaster) {
    secondMasterSalary = calculateSalary(
      secondMaster.salary_base,
      secondMaster.salary_per_sale,
      secondMasterSales,
      true
    );
  }

  return {
    total_sales: totalSales,
    first_master_sales: firstMasterSales,
    second_master_sales: secondMasterSales,
    first_master_salary: firstMasterSalary,
    second_master_salary: secondMasterSalary,
    first_master_shift_coefficient: 1.0,
    second_master_shift_coefficient: isSolo ? null : 0.5,
  };
}

export function calculateMasterRevision(
  shouldBe: number,
  actuallyAvailable: number,
  totalShiftsOnLocation: number,
  masterPersonalShifts: number
): number {
  if (totalShiftsOnLocation === 0) return 0;
  const difference = shouldBe - actuallyAvailable;
  return (difference / totalShiftsOnLocation) * masterPersonalShifts;
}
