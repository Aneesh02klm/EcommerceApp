SELECT setval('specificationdefinitions_id_seq', (SELECT MAX(id) FROM specificationdefinitions));
