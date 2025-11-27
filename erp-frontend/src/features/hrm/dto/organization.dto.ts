export interface OrgEmployeeDTO {
  id: number;
  emp_code: string;
  full_name: string;
  status: string;
}

export interface OrgPositionDTO {
  id: number;
  name: string;
  employees: OrgEmployeeDTO[];
}

export interface OrgDepartmentDTO {
  id: number;
  code: string;
  name: string;
  positions: OrgPositionDTO[];
}

export interface OrganizationChartDTO {
  branch: {
    id: number;
    code: string;
    name: string;
  };
  departments: OrgDepartmentDTO[];
}
