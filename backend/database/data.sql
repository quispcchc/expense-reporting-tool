INSERT INTO account_numbers
(account_number_id, account_number, description, created_at, updated_at)
VALUES (1, 50001, 'Admin Assistant 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2, 50002, 'Admin Assistant 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3, 50003, 'Admin Assistant 3 / Executive Assistant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (4, 50004, 'Clinical Aide', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (5, 50005, 'Clinical Coordinator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6, 50007, 'Coordinator of Volunteers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (7, 50008, 'Executive Director', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (8, 50010, 'Medical Office Administrator 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (9, 50012, 'Medical Receptionist', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (10, 50013, 'Medical Secretary 3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (11, 50014, 'Program Assistant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (12, 50015, 'Program Director', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (13, 50016, 'Program Manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (14, 50019, 'Coordinator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO cost_centres (cost_centre_code, active_status_id, description, department_id, created_at, updated_at)
VALUES (5750, 1, 'Assertive Community Treatment Team', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

       (1000, 1, 'General Clearing Account', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1030, 1, 'Volunteer Services', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1031, 1, 'General donations', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1040, 1, 'Building operations', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1060, 1, 'Carlington Hub Project', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1061, 1, 'Community Infrastructure Relief Fund (CIRF)', 2, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (1062, 1, 'Investing in Capital Infrastructure (ICIP)', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1065, 1, 'Improving Access to Mental Health Resources', 2, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (1300, 1, 'Corporate Services', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1320, 1, 'General and Administrative CCHC', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1335, 1, 'Information Technology', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1390, 1, 'Year End Funding - Coalition', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1410, 1, 'City of Ottawa Corporate Services', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (1420, 1, 'SSRF - Capacity Building', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

       (6020, 1, 'Alexander/Caldwell CDF', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6030, 1, 'Van Lang CDF', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6040, 1, 'OCF - Women in the Wild', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6041, 1, 'National Pet Food Bank', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6042, 1, 'Red Cross - Finding Our Way Together', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6043, 1, 'PON - Wealth of Knowledge', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6045, 1, 'Westboro Beach Community Association', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6050, 1, 'Community Voice Mail', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6055, 1, 'Community Volunteer Income Tax Program', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6315, 1, 'HPCT', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6410, 1, 'HPCT - City', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6615, 1, 'Social Prescribing for Better Mental Health', 3, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (6940, 1, 'Special Projects', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

       (2250, 1, 'Children''s Mental Health', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2370, 1, 'Early Years II', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2400, 1, 'Annavale Headstart Nursery School', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2405, 1, 'Fundraising Annavale', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2410, 1, 'Annavale Minor Capital', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2425, 1, 'SSRF - Virtual Prenatal Program', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2426, 1, 'SSRF - Mental Health Program', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2430, 1, 'Provincial Child Care Wage Enhancement', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2431, 1, 'Provincial Child Care Wage Enhancement', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2440, 1, 'City Children Programming', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2550, 1, 'Building on Opportunities for School Transition (BOOST)', 5, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (2830, 1, 'Buns in the Oven', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2910, 1, 'Baby Cupboard', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2930, 1, 'Child Care', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2950, 1, 'PCYS Donations', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6000, 1, 'After the Bell (previously Van Lang - Summer Program)', 4, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (6420, 1, 'Youth Office - Bellevue', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6820, 1, 'Students Will All Graduate (SWAG)', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6825, 1, 'Future Launch', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6830, 1, 'Red-Blacks Mentorship Program', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6850, 1, 'After School Strategies', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

       (3301, 1, 'Non-Insured', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3303, 1, 'Psychiatrist POS', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3325, 1, 'Primary Health Care', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3326, 1, 'Physician Compensation', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3327, 1, 'Nurse Practitioner', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3328, 1, 'COVID-19', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (5315, 1, 'Counselling', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (5410, 1, 'City', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (5420, 1, 'City - Counselling', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (5425, 1, 'SSRF - System Navigation', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6110, 1, 'Transitional Housing Support', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6120, 1, 'VAW Counselling', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6121, 1, 'Capacity Building', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


INSERT INTO claim_status
    (claim_status_id, claim_status_name, claim_status_desc)
VALUES (1, 'Pending', 'Pending'),
       (2, 'Approved', 'Approved'),
       (3, 'Rejected', 'Rejected');

INSERT INTO approval_status (approval_status_id, approval_status_name, approval_status_desc)
VALUES (1, 'Pending', 1),
       (2, 'Approved', 2),
       (3, 'Rejected', 3);


INSERT INTO claim_types (claim_type_id, active_status_id, claim_type_name, claim_type_desc)
VALUES (1, 1, 'Reimbursement', 'Reimbursement'),
       (2, 1, 'Petty Cash', 'Petty Cash'),
       (3, 1, 'Corporate Card', 'Corporate Card'),
       (4, 1, 'Non-Staff', 'Non-Staff'),
       (5, 1, 'Vendor Invoice', 'Vendor Invoice');


INSERT INTO projects (active_status_id, project_name, project_desc, department_id)
VALUES (1, 'Access to Community-Based Mental Health Care', 'ACTT', 1),
       (1, 'Access to Health Protection and Prevention Services', 'ACTT', 1),
       (1, 'CSAN Pronto', 'ACTT', 1),
       (1, 'Eastern Ontario ACT Network', 'ACTT', 1),
       (1, 'Family Engagement', 'ACTT', 1),
       (1, 'Fidelity Review', 'ACTT', 1),
       (1, 'Hospital Service Reduction', 'ACTT', 1),
       (1, 'STOP (Smoking Treatment for Ontario Patients) Program', 'ACTT', 1),
       (1, 'Student Training for ACTT', 'ACTT', 1),
       (1, 'Audit', 'CS', 2),
       (1, 'Finance', 'CS', 2),
       (1, 'IT', 'CS', 2),
       (1, 'Payroll', 'CS', 2),
       (1, 'Annual All Staff Satisfaction Survey', 'CS', 2),
       (1, 'Equity, Diversity, and Inclusion (EDI) Plan', 'CS', 2),
       (1, 'CDF Programs', 'CHV', 3),
       (1, 'Chai Chat Support Group', 'CHV', 3),
       (1, 'Chart Audits', 'CHV', 3),
       (1, 'Client Feedback Surveys', 'CHV', 3),
       (1, 'Clinical Supervision and Reflective Practice', 'CHV', 3),
       (1, 'Community Events and Celebrations', 'CHV', 3),
       (1, 'Community Gardening Program', 'CHV', 3),
       (1, 'Community Meals and Kitchens', 'CHV', 3),
       (1, 'Cooking Classes', 'CHV', 3),
       (1, 'After School Program', 'HGD', 4),
       (1, 'Baby-Friendly Initiative', 'HGD', 4),
       (1, 'EarlyON Program', 'HGD', 4),
       (1, 'Youth Drop-In', 'HGD', 4),
       (1, 'Youth Hotmeals', 'HGD', 4),
       (1, 'Access to Primary Care Services', 'HIS', 5),
       (1, 'Adult General Counselling', 'HIS', 5),
       (1, 'Flu Clinics', 'HIS', 5),
       (1, 'Violence Against Women', 'HIS', 5),
       (1, 'Youth Counselling', 'HIS', 5);



INSERT INTO teams (team_name, team_abbreviation, team_desc, department_id,active_status_id)
VALUES
    -- Assertive Community Treathment Team (ACTT):
    ('Assertive Community Treatment Team', 'ACTT', 'Specialized treatment team', 1,1),

    -- Corporate Services
    ('Finance and Administration', 'FA', 'Handles finance and admin tasks', 2,1),
    ('Human Resources', 'HR', 'Responsible for HR functions', 2,1),
    ('Executive Assistant', 'EA', 'Supports executives', 2,1),

    -- Community Health and Vitality:
    ('Health Promotion and Community Development', 'HPCD', 'Community health promotion', 3,1),
    ('Quality Improvement and Special Projects', 'QISP', 'Quality improvement initiatives', 3,1),
    ('Information Technology', 'IT', 'IT support and development', 3,1),
    ('Communication and Resource Development', 'CRD', 'Internal and external communications', 3,1),

    -- Healthy Growth and Development
    ('Annavale Child Care', 'ACC', 'Child care programs', 4,1),
    ('Youth Programs', 'YP', 'Programs for youth development', 4,1),
    ('Prenatal Programs', 'PP', 'Prenatal care and education', 4,1),

    -- Integrated Health Services
    ('Primary Health Clinic', 'PHC', 'Primary healthcare services', 5,1),
    ('Counselling', 'CNS', 'Counselling and mental health support', 5,1);





