export class SearchQueryDto {
  query!: string;
  entityTypes?: string[];
  providerNames?: string[];
  limit?: number;
  offset?: number;
}
