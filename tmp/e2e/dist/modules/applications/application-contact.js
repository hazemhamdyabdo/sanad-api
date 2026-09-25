import { COUNTRY_NAME_EN, countryOfLocation, TARGET_COUNTRIES } from '../jobs/index.js';
const EGYPT_LOCAL_MOBILE = /^01[0125]\d{8}$/;
export function internationalPhone(phone) {
    const digits = phone.replace(/[\s().-]/g, '');
    if (EGYPT_LOCAL_MOBILE.test(digits)) {
        return `+20 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    if (/^0020\d+$/.test(digits)) {
        return internationalPhone(`0${digits.slice(4)}`);
    }
    return phone;
}
export function contactForJobCountry(cv, jobCountry) {
    if (!cv.contact) {
        return cv;
    }
    const contact = { ...cv.contact };
    if (contact.phone) {
        contact.phone = internationalPhone(contact.phone);
    }
    const home = countryOfLocation(contact.location);
    const target = TARGET_COUNTRIES.find((code) => code === jobCountry);
    const latin = !!contact.location && !/[؀-ۿ]/.test(contact.location);
    if (contact.location && latin && home && home !== target && !contact.location.toLowerCase().includes(COUNTRY_NAME_EN[home].toLowerCase())) {
        contact.location = `${contact.location}, ${COUNTRY_NAME_EN[home]}`;
    }
    return { ...cv, contact };
}
//# sourceMappingURL=application-contact.js.map