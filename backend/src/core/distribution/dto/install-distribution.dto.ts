export class InstallDistributionDto {
  distributionId!: string;
  installedByPersonId?: string;
  options?: Record<string, unknown>;
}
