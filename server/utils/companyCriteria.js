function buildCompanyCriteria(company) {
  const criteria = {
    cgpa: company?.minCgpa ?? null,
    branches: Array.isArray(company?.branches) ? company.branches : [],
    noBacklogs: !!company?.noBacklogs,
    tenthPercentage: company?.tenthPercentage ?? null,
    twelfthPercentage: company?.twelfthPercentage ?? null,
  };

  return criteria;
}

module.exports = {
  buildCompanyCriteria,
};
