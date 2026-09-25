export const ROLE_GROUP_IDS = [
    'software_development',
    'ai_ml',
    'it_support',
    'data_analytics',
    'design_creative',
    'marketing',
    'accounting_finance',
    'administrative_clerical',
    'hr_recruitment',
    'translation',
    'sales_retail',
    'customer_service_call_center',
    'hospitality_food_service',
    'healthcare_clinical_support',
    'pharmacy',
    'education',
    'transport_delivery',
    'warehouse_logistics',
    'security',
    'skilled_trades_construction',
    'automotive',
    'cleaning_services',
    'personal_domestic_services',
    'engineering_non_software',
    'legal',
    'real_estate',
    'fitness',
];
export const ROLE_GROUPS = [
    { id: 'software_development', keywords: ['frontend developer', 'backend developer', 'full stack developer', 'mobile app developer'] },
    { id: 'ai_ml', keywords: ['AI engineer', 'machine learning engineer', 'data scientist'] },
    { id: 'it_support', keywords: ['IT support technician'] },
    { id: 'data_analytics', keywords: ['data analyst'] },
    { id: 'design_creative', keywords: ['graphic designer', 'UI UX designer'] },
    { id: 'marketing', keywords: ['digital marketing specialist', 'social media specialist'] },
    { id: 'accounting_finance', keywords: ['accountant', 'accounts assistant'] },
    { id: 'administrative_clerical', keywords: ['administrative assistant', 'data entry clerk', 'office manager'] },
    { id: 'hr_recruitment', keywords: ['HR specialist', 'recruiter'] },
    { id: 'translation', keywords: ['translator'] },
    { id: 'sales_retail', keywords: ['sales representative', 'retail cashier', 'retail store manager'] },
    { id: 'customer_service_call_center', keywords: ['customer service representative', 'call center agent'] },
    { id: 'hospitality_food_service', keywords: ['cook', 'waiter', 'barista', 'hotel receptionist'] },
    { id: 'healthcare_clinical_support', keywords: ['nurse', 'medical assistant', 'physical therapist'] },
    { id: 'pharmacy', keywords: ['pharmacist'] },
    { id: 'education', keywords: ['teacher', 'private tutor', 'teaching assistant'] },
    { id: 'transport_delivery', keywords: ['driver', 'delivery rider'] },
    { id: 'warehouse_logistics', keywords: ['warehouse worker', 'factory worker'] },
    { id: 'security', keywords: ['security guard'] },
    { id: 'skilled_trades_construction', keywords: ['electrician', 'plumber', 'carpenter', 'construction worker'] },
    { id: 'automotive', keywords: ['mechanic'] },
    { id: 'cleaning_services', keywords: ['cleaner'] },
    { id: 'personal_domestic_services', keywords: ['tailor', 'hairdresser'] },
    { id: 'engineering_non_software', keywords: ['civil engineer', 'mechanical engineer', 'electrical engineer'] },
    { id: 'legal', keywords: ['lawyer'] },
    { id: 'real_estate', keywords: ['real estate agent', 'property consultant'] },
    { id: 'fitness', keywords: ['fitness trainer', 'gym instructor'] },
];
export const ROLE_DEFINITIONS = [
    { code: 'ai_engineer', group: 'ai_ml', keyword: 'AI engineer', labelEn: 'AI Engineer', labelAr: 'مهندس ذكاء اصطناعي', aliases: ['artificial intelligence engineer', 'ai developer', 'ai software engineer', 'ai/ml engineer', 'ai ml engineer', 'ai/ml', 'ai ml', 'generative ai engineer', 'genai engineer', 'llm engineer', 'ai specialist', 'ai researcher', 'software engineer ai', 'ki engineer', 'ki entwickler'] },
    { code: 'machine_learning_engineer', group: 'ai_ml', keyword: 'machine learning engineer', labelEn: 'Machine Learning Engineer', labelAr: 'مهندس تعلم آلي', aliases: ['ml engineer', 'machine learning', 'ml developer', 'mlops engineer', 'deep learning engineer', 'deep learning', 'computer vision engineer', 'computer vision', 'nlp engineer', 'nlp', 'natural language processing', 'ml researcher', 'applied scientist'] },
    { code: 'data_scientist', group: 'ai_ml', keyword: 'data scientist', labelEn: 'Data Scientist', labelAr: 'عالم بيانات', aliases: ['data science', 'junior data scientist', 'senior data scientist', 'research scientist', 'quantitative analyst'] },
    { code: 'frontend_developer', group: 'software_development', keyword: 'frontend developer', labelEn: 'Frontend Developer', labelAr: 'مطور واجهات أمامية', aliases: ['frontend', 'front-end developer', 'front end developer', 'front-end engineer', 'web developer', 'ui developer', 'javascript developer', 'react developer', 'angular developer', 'vue developer'] },
    { code: 'backend_developer', group: 'software_development', keyword: 'backend developer', labelEn: 'Backend Developer', labelAr: 'مطور خلفي (باك اند)', aliases: ['backend', 'back-end developer', 'back end developer', 'back-end engineer', 'server-side developer', 'api developer', 'node developer', 'php developer', 'laravel developer', '.net developer', 'java developer', 'python developer'] },
    { code: 'fullstack_developer', group: 'software_development', keyword: 'full stack developer', labelEn: 'Full-Stack Developer', labelAr: 'مطور فل ستاك', aliases: ['fullstack', 'full stack', 'full-stack', 'fullstack developer', 'full-stack developer', 'fullstack engineer', 'full-stack engineer', 'software engineer', 'software developer', 'web application developer'] },
    { code: 'mobile_developer', group: 'software_development', keyword: 'mobile app developer', labelEn: 'Mobile App Developer', labelAr: 'مطور تطبيقات موبايل', aliases: ['android developer', 'ios developer', 'flutter developer', 'react native developer', 'app developer', 'mobile application developer'] },
    { code: 'it_support', group: 'it_support', keyword: 'IT support technician', labelEn: 'IT Support', labelAr: 'دعم فني', aliases: ['technical support', 'help desk', 'helpdesk technician', 'desktop support', 'network technician', 'system administrator'] },
    { code: 'data_analyst', group: 'data_analytics', keyword: 'data analyst', labelEn: 'Data Analyst', labelAr: 'محلل بيانات', aliases: ['business intelligence analyst', 'bi analyst', 'reporting analyst'] },
    { code: 'graphic_designer', group: 'design_creative', keyword: 'graphic designer', labelEn: 'Graphic Designer', labelAr: 'مصمم جرافيك', aliases: ['visual designer', 'brand designer', 'print designer'] },
    { code: 'ui_ux_designer', group: 'design_creative', keyword: 'UI UX designer', labelEn: 'UI/UX Designer', labelAr: 'مصمم UI/UX', aliases: ['ux designer', 'ui designer', 'product designer', 'user experience designer'] },
    { code: 'digital_marketing', group: 'marketing', keyword: 'digital marketing specialist', labelEn: 'Digital Marketing', labelAr: 'أخصائي تسويق رقمي', aliases: ['marketing specialist', 'seo specialist', 'performance marketer', 'growth marketer', 'marketing coordinator'] },
    { code: 'social_media_specialist', group: 'marketing', keyword: 'social media specialist', labelEn: 'Social Media Specialist', labelAr: 'أخصائي سوشيال ميديا', aliases: ['social media manager', 'content creator', 'community manager'] },
    { code: 'accountant', group: 'accounting_finance', keyword: 'accountant', labelEn: 'Accountant', labelAr: 'محاسب', aliases: ['bookkeeper', 'financial accountant', 'general accountant', 'tax accountant', 'cost accountant'] },
    { code: 'accounts_assistant', group: 'accounting_finance', keyword: 'accounts assistant', labelEn: 'Accounts Assistant', labelAr: 'مساعد محاسب', aliases: ['accounting assistant', 'junior accountant', 'accounts clerk'] },
    { code: 'administrative_assistant', group: 'administrative_clerical', keyword: 'administrative assistant', labelEn: 'Administrative Assistant', labelAr: 'موظف إداري / سكرتير', aliases: ['secretary', 'office assistant', 'executive assistant', 'personal assistant'] },
    { code: 'data_entry', group: 'administrative_clerical', keyword: 'data entry clerk', labelEn: 'Data Entry Clerk', labelAr: 'مدخل بيانات', aliases: ['data entry operator', 'typist'] },
    { code: 'office_manager', group: 'administrative_clerical', keyword: 'office manager', labelEn: 'Office Manager', labelAr: 'مدير مكتب', aliases: ['operations coordinator'] },
    { code: 'hr_specialist', group: 'hr_recruitment', keyword: 'HR specialist', labelEn: 'HR Specialist', labelAr: 'أخصائي موارد بشرية', aliases: ['human resources specialist', 'hr generalist', 'hr coordinator', 'hr officer'] },
    { code: 'recruiter', group: 'hr_recruitment', keyword: 'recruiter', labelEn: 'Recruiter', labelAr: 'أخصائي توظيف', aliases: ['talent acquisition specialist', 'recruitment specialist'] },
    { code: 'translator', group: 'translation', keyword: 'translator', labelEn: 'Translator', labelAr: 'مترجم', aliases: ['interpreter', 'localization specialist'] },
    { code: 'sales_representative', group: 'sales_retail', keyword: 'sales representative', labelEn: 'Sales Representative', labelAr: 'مندوب مبيعات', aliases: ['sales executive', 'sales agent', 'account executive', 'business development representative'] },
    { code: 'retail_cashier', group: 'sales_retail', keyword: 'retail cashier', labelEn: 'Retail Cashier', labelAr: 'كاشير', aliases: ['cashier', 'checkout operator', 'point of sale operator'] },
    { code: 'store_manager', group: 'sales_retail', keyword: 'retail store manager', labelEn: 'Store Manager', labelAr: 'مدير متجر', aliases: ['shop manager', 'branch manager', 'retail manager'] },
    { code: 'customer_service', group: 'customer_service_call_center', keyword: 'customer service representative', labelEn: 'Customer Service', labelAr: 'خدمة عملاء', aliases: ['customer support', 'customer care agent', 'client service representative'] },
    { code: 'call_center_agent', group: 'customer_service_call_center', keyword: 'call center agent', labelEn: 'Call Center Agent', labelAr: 'موظف كول سنتر', aliases: ['contact center agent', 'telesales agent', 'inbound agent', 'outbound agent'] },
    { code: 'cook', group: 'hospitality_food_service', keyword: 'cook', labelEn: 'Cook', labelAr: 'طباخ / شيف', aliases: ['chef', 'line cook', 'kitchen staff', 'sous chef'] },
    { code: 'waiter', group: 'hospitality_food_service', keyword: 'waiter', labelEn: 'Waiter', labelAr: 'نادل', aliases: ['waitress', 'server', 'restaurant server'] },
    { code: 'barista', group: 'hospitality_food_service', keyword: 'barista', labelEn: 'Barista', labelAr: 'باريستا', aliases: ['coffee shop staff'] },
    { code: 'hotel_receptionist', group: 'hospitality_food_service', keyword: 'hotel receptionist', labelEn: 'Hotel Receptionist', labelAr: 'موظف استقبال فندق', aliases: ['front desk agent', 'front office agent'] },
    { code: 'nurse', group: 'healthcare_clinical_support', keyword: 'nurse', labelEn: 'Nurse', labelAr: 'ممرض / ممرضة', aliases: ['registered nurse', 'staff nurse', 'icu nurse'] },
    { code: 'medical_assistant', group: 'healthcare_clinical_support', keyword: 'medical assistant', labelEn: 'Medical Assistant', labelAr: 'مساعد طبي', aliases: ['clinic assistant', 'healthcare assistant'] },
    { code: 'physical_therapist', group: 'healthcare_clinical_support', keyword: 'physical therapist', labelEn: 'Physical Therapist', labelAr: 'أخصائي علاج طبيعي', aliases: ['physiotherapist'] },
    { code: 'pharmacist', group: 'pharmacy', keyword: 'pharmacist', labelEn: 'Pharmacist', labelAr: 'صيدلي', aliases: ['pharmacy technician'] },
    { code: 'teacher', group: 'education', keyword: 'teacher', labelEn: 'Teacher', labelAr: 'مدرس', aliases: ['school teacher', 'instructor', 'educator'] },
    { code: 'private_tutor', group: 'education', keyword: 'private tutor', labelEn: 'Private Tutor', labelAr: 'مدرس خصوصي', aliases: ['tutor', 'home tutor'] },
    { code: 'teaching_assistant', group: 'education', keyword: 'teaching assistant', labelEn: 'Teaching Assistant', labelAr: 'مدرس مساعد', aliases: ['classroom assistant'] },
    { code: 'driver', group: 'transport_delivery', keyword: 'driver', labelEn: 'Driver', labelAr: 'سائق', aliases: ['chauffeur', 'truck driver'] },
    { code: 'delivery_rider', group: 'transport_delivery', keyword: 'delivery rider', labelEn: 'Delivery Rider', labelAr: 'عامل توصيل', aliases: ['motorcycle courier', 'courier', 'delivery driver'] },
    { code: 'warehouse_worker', group: 'warehouse_logistics', keyword: 'warehouse worker', labelEn: 'Warehouse Worker', labelAr: 'عامل مخازن', aliases: ['warehouse associate', 'stock clerk', 'inventory clerk'] },
    { code: 'factory_worker', group: 'warehouse_logistics', keyword: 'factory worker', labelEn: 'Factory Worker', labelAr: 'عامل مصنع', aliases: ['production worker', 'assembly line worker', 'machine operator'] },
    { code: 'security_guard', group: 'security', keyword: 'security guard', labelEn: 'Security Guard', labelAr: 'أمن / حارس', aliases: ['security officer', 'watchman'] },
    { code: 'electrician', group: 'skilled_trades_construction', keyword: 'electrician', labelEn: 'Electrician', labelAr: 'كهربائي', aliases: ['electrical technician'] },
    { code: 'plumber', group: 'skilled_trades_construction', keyword: 'plumber', labelEn: 'Plumber', labelAr: 'سباك', aliases: ['plumbing technician'] },
    { code: 'carpenter', group: 'skilled_trades_construction', keyword: 'carpenter', labelEn: 'Carpenter', labelAr: 'نجار', aliases: ['woodworker', 'furniture maker'] },
    { code: 'construction_worker', group: 'skilled_trades_construction', keyword: 'construction worker', labelEn: 'Construction Worker', labelAr: 'عامل بناء', aliases: ['laborer', 'site worker', 'construction laborer'] },
    { code: 'mechanic', group: 'automotive', keyword: 'mechanic', labelEn: 'Mechanic', labelAr: 'ميكانيكي', aliases: ['auto mechanic', 'car mechanic', 'automotive technician'] },
    { code: 'cleaner', group: 'cleaning_services', keyword: 'cleaner', labelEn: 'Cleaner', labelAr: 'عامل نظافة', aliases: ['housekeeping staff', 'janitor', 'cleaning staff'] },
    { code: 'tailor', group: 'personal_domestic_services', keyword: 'tailor', labelEn: 'Tailor', labelAr: 'خياط', aliases: ['seamstress', 'dressmaker'] },
    { code: 'hairdresser', group: 'personal_domestic_services', keyword: 'hairdresser', labelEn: 'Hairdresser', labelAr: 'حلاق / كوافير', aliases: ['barber', 'hair stylist', 'salon stylist'] },
    { code: 'civil_engineer', group: 'engineering_non_software', keyword: 'civil engineer', labelEn: 'Civil Engineer', labelAr: 'مهندس مدني', aliases: ['structural engineer', 'site engineer'] },
    { code: 'mechanical_engineer', group: 'engineering_non_software', keyword: 'mechanical engineer', labelEn: 'Mechanical Engineer', labelAr: 'مهندس ميكانيكي', aliases: ['hvac engineer'] },
    { code: 'electrical_engineer', group: 'engineering_non_software', keyword: 'electrical engineer', labelEn: 'Electrical Engineer', labelAr: 'مهندس كهرباء', aliases: ['power engineer'] },
    { code: 'lawyer', group: 'legal', keyword: 'lawyer', labelEn: 'Lawyer', labelAr: 'محامي', aliases: ['attorney', 'legal counsel', 'legal advisor'] },
    { code: 'real_estate_agent', group: 'real_estate', keyword: 'real estate agent', labelEn: 'Real Estate Agent', labelAr: 'وسيط عقاري', aliases: ['property agent', 'realtor'] },
    { code: 'property_consultant', group: 'real_estate', keyword: 'property consultant', labelEn: 'Property Consultant', labelAr: 'مستشار عقاري', aliases: ['real estate consultant'] },
    { code: 'fitness_trainer', group: 'fitness', keyword: 'fitness trainer', labelEn: 'Fitness Trainer', labelAr: 'مدرب لياقة', aliases: ['personal trainer', 'gym trainer'] },
    { code: 'gym_instructor', group: 'fitness', keyword: 'gym instructor', labelEn: 'Gym Instructor', labelAr: 'مدرب جيم', aliases: ['fitness instructor', 'group exercise instructor'] },
];
const ROLE_BY_CODE = new Map(ROLE_DEFINITIONS.map((role) => [role.code, role]));
const GROUP_BY_ID = new Map(ROLE_GROUPS.map((group) => [group.id, group]));
export function getRoleByCode(code) {
    return ROLE_BY_CODE.get(code);
}
export function getGroupById(id) {
    const group = GROUP_BY_ID.get(id);
    if (!group) {
        throw new Error(`Unknown role group "${id}".`);
    }
    return group;
}
export function normalize(text) {
    return text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ');
}
export function resolveRoleFromCvTitle(title) {
    if (!title) {
        return null;
    }
    const normalizedTitle = normalize(title);
    if (!normalizedTitle) {
        return null;
    }
    const padded = ` ${normalizedTitle} `;
    let best = null;
    for (const role of ROLE_DEFINITIONS) {
        for (const candidate of [role.labelEn, role.keyword, ...role.aliases]) {
            const phrase = normalize(candidate);
            if (padded.includes(` ${phrase} `) && phrase.length > (best?.length ?? 0)) {
                best = { role, length: phrase.length };
            }
        }
    }
    return best?.role ?? null;
}
for (const role of ROLE_DEFINITIONS) {
    const group = GROUP_BY_ID.get(role.group);
    if (!group) {
        throw new Error(`Role "${role.code}" references unknown group "${role.group}".`);
    }
    if (!group.keywords.includes(role.keyword)) {
        throw new Error(`Role "${role.code}"'s keyword "${role.keyword}" is not in group "${role.group}"'s keywords.`);
    }
}
//# sourceMappingURL=roles.js.map