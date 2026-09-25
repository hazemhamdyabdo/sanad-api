# API Contract — سَنَد

المصدر الوحيد لشكل الـ endpoints. نسخة متطابقة في `sanad-api` و`sanad-client`.

**قاعدة:** الفرونت متبني على الشكل ده بـ mock data. الباك يلتزم بيه حرفيًا. أي تغيير يتناقش ويتعدل في النسختين مع بعض.

**Phase 1** = الجهاز، والمحادثة، والـ CV. **Phase 2** = التفضيلات ومطابقة الوظايف (§6)، والتقديم (§7).

---

## عام

- Base URL: `/api/v1`
- كل request فيه header: `X-Device-Id: <uuid v4>` — الفرونت بيولّده أول مرة ويخزنه على الجهاز ومبيتغيرش.
- الـ requests والـ responses JSON، ما عدا رفع الملفات (multipart) والـ PDF والـ SSE.
- التواريخ ISO 8601 UTC.

### شكل الخطأ (موحّد)

```json
{
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "مش قادرين نحوّل الكلام دلوقتي، جرب تاني",
    "retryable": true
  }
}
```

`message` بالمصري لأن الفرونت بيعرضه زي ما هو — ده ينطبق كمان على أخطاء الـ validation (مفيش أبدًا رسالة إنجليزي زي `jobIds must contain...`). الحدود اللي الفرونت يقدر يوصلها ليها رسالة مخصوصة (مثلًا أكتر من 20 وظيفة في `POST /applications`)، والباقي رسالة عامة.

أكواد: `INVALID_REQUEST` · `DEVICE_REQUIRED` · `NOT_FOUND` · `UNSUPPORTED_FILE` · `PARSING_FAILED` · `TRANSCRIPTION_FAILED` · `AI_UNAVAILABLE` · `RATE_LIMITED` · `INTERNAL`

### ثوابت

- `SectionId`: `basic` · `experience` · `projects` · `education` · `certificates` · `skills` · `languages`
  (`projects` بتحل محل `experience` لو اليوزر مشتغلش قبل كده)
- `Level`: `beginner` · `intermediate` · `advanced` · `expert` · `native` (اللغات بس)
- `MessageType`: `text` · `section_card` · `cv_ready_card`
- كل الـ enums بحروف صغيرة. الترجمة للعربي مسؤولية الفرونت.

---

## 1. الجهاز

### `POST /devices`

أول ما الـ app يفتح لأول مرة. لو الجهاز متسجل قبل كده بيرجّع نفس البيانات (idempotent).

Request:
```json
{ "platform": "android", "appVersion": "1.0.0", "locale": "ar-EG", "region": "EG" }
```

Response `200`:
```json
{
  "deviceId": "a3f1...",
  "createdAt": "2026-09-23T20:00:00Z",
  "state": {
    "hasCv": false,
    "activeSessionId": "cnv_01H...",
    "completedSections": ["basic", "experience"],
    "nextSection": "education"
  }
}
```

`state` هو اللي الفرونت بيقرر منه: يبدأ من الأول، ولا يعرض "تحب تكمل من حيث وقفت؟".
لو مفيش جلسة شغالة: `activeSessionId: null` و`completedSections: []`.

---

## 2. المحادثة

الـ session فيها **كل** الرسايل، من الـ AI ومن اليوزر، مرتبة. الفرونت مبيبعتش history أبدًا.

### `POST /conversations`

Request:
```json
{ "mode": "build", "uploadId": null }
```
- `mode`: `build` (من الأول) أو `upload` (بعد رفع CV، ومعاه `uploadId`).
- لو فيه session شغالة بالفعل، بيرجع `409` مع `activeSessionId`، إلا لو اتبعت `"restart": true` فبيمسح القديمة ويبدأ جديدة.

Response `201`:
```json
{
  "sessionId": "cnv_01H...",
  "mode": "build",
  "sections": [
    { "id": "basic", "label": "البيانات الأساسية", "status": "pending" },
    { "id": "experience", "label": "الخبرات", "status": "pending" }
  ],
  "currentSection": "basic",
  "messages": [],
  "status": "in_progress"
}
```

- `sections` بتيجي من الباك مش ثابتة في الفرونت — في مسار الـ upload بترجع الناقصة بس.
- `status` للسكشن: `pending` · `in_progress` · `confirmed`.
- `status` للجلسة: `in_progress` · `completed`.

### `GET /conversations/:sessionId`

الجلسة كاملة بكل الرسايل — لما اليوزر يرجع للـ app.

```json
{
  "sessionId": "cnv_01H...",
  "mode": "build",
  "sections": [],
  "currentSection": "education",
  "messages": [
    { "id": "msg_01", "role": "ai", "section": "basic", "type": "text", "text": "...", "createdAt": "..." },
    { "id": "msg_02", "role": "user", "section": "basic", "type": "text", "text": "أحمد حسن", "source": "voice", "audioDurationSec": 3, "createdAt": "..." }
  ],
  "status": "in_progress"
}
```

### `DELETE /conversations/:sessionId`

يمسح الجلسة والـ CV المرتبط بيها. الفرونت بيستخدمه لما اليوزر يختار "أبدأ من الأول".
Response `204`.

### `POST /conversations/:sessionId/messages` — SSE

اليوزر يبعت رده، والرد بيرجع stream.

Request:
```json
{ "text": "كنت في محل موبايلات سنتين", "source": "voice", "audioDurationSec": 6 }
```
`source`: `text` أو `voice`. الرسالة بتتحفظ في الـ session قبل ما الـ AI يبدأ.

Response: `text/event-stream`

الأحداث:

```
event: user_message
data: { "id": "msg_10", "role": "user", "section": "experience", "type": "text", "text": "...", "source": "voice", "audioDurationSec": 6, "createdAt": "..." }

event: message_start
data: { "id": "msg_11", "role": "ai", "section": "experience", "type": "text" }

event: token
data: { "text": "كنت " }

event: message_end
data: { "id": "msg_11", "text": "النص الكامل للرسالة", "quickReplies": ["حوالي 40 زبون", "أكتر من 100"] }

event: section_card
data: { "id": "msg_12", "section": "experience", "isLast": false, "card": { }, "actions": ["تأكيد", "تعديل"] }

event: done
data: { "currentSection": "experience", "status": "in_progress" }
```

قواعد:
- **النص بيتـ stream بالـ `token`. الكروت بتيجي كاملة في event واحد.**
- `quickReplies` بتيجي في `message_end` لأنها بتتحدد بعد ما الرد يخلص.
- أي خطأ في النص: `event: error` وفيه شكل الخطأ الموحد، وبعدها الـ stream بيقفل.
- heartbeat (`: ping`) كل 15 ثانية.
- لو الاتصال قطع، الفرونت يعمل `GET /conversations/:id` ويكمّل من الرسايل المحفوظة.

### `POST /conversations/:sessionId/sections/:sectionId/confirm`

اليوزر وافق على السكشن، فتتحفظ في الـ CV.

Request:
```json
{ "messageId": "msg_12", "isLast": false, "edits": null }
```
- `edits`: تعديلات اليوزر على محتوى الكارت قبل الموافقة، أو `null`.
- `isLast: true` معناها دي آخر سكشن، فالـ CV يتقفل ويترجع `cvId`.

Response `200`:
```json
{
  "section": "experience",
  "status": "confirmed",
  "nextSection": "education",
  "sessionStatus": "in_progress",
  "cvId": null,
  "nextMessage": { "id": "msg_13", "role": "ai", "section": "education", "type": "text", "text": "جميل. نتكلم عن تعليمك — اتخرجت في إيه ومن فين؟", "createdAt": "..." }
}
```
لما `isLast: true`: `nextSection: null`، و`sessionStatus: "completed"`، و`cvId` فيه الـ id، و`nextMessage` بتكون رسالة الختام (بـ `section: null`) بدل رسالة سكشن جديد:
```json
{ "id": "msg_20", "role": "ai", "section": null, "type": "text", "text": "مبروك! خلصنا الـ CV بتاعك 🎉 تقدر تراجعه دلوقتي وتعدل أي حاجة قبل ما تحمّله.", "createdAt": "..." }
```

`nextMessage` بتتحفظ في الـ session زي أي رسالة تانية (بترجع كمان مع `GET /conversations/:id`)، عشان الشات مايفضلش ساكت بعد التأكيد.

---

## 3. تحويل الصوت لنص

### `POST /transcriptions`

`multipart/form-data`: `audio` (m4a أو wav، أقصى 60 ثانية / 10MB)، و`sessionId` اختياري عشان الـ AI يستعين بالسياق.

Response `200`:
```json
{ "text": "كنت في محل موبايلات في مدينة نصر سنتين", "durationSec": 6 }
```

النص بيتعرض لليوزر **للتعديل** قبل الإرسال، فالباك مبيبعتش الرسالة أوتوماتيك.

---

## 4. رفع CV وتحليلها

الباك بياخد ملف الـ CV نفسه (PDF) ويبعته للموديل كملف — مش نص متسحب منه — عشان يشوف التنسيق كمان. الناتج مش مجرد بيانات متقسّمة، ده تحليل كامل (analysis): السكشنز العادية بتاعة الـ CV، ومعاها خبرة/مهارات/مجالات/نقط قوة وضعف/مشاكل في جودة الملف نفسه/تقييم عام. الـ analysis ده بيتخزن على الجهاز ومنه هيتبنى الـ CV (لما اليوزر يراجعه ويكمّله في المحادثة) وهيتستخدم بعدين في مطابقة الوظايف.

### `POST /cv/uploads`

`multipart/form-data`: `file` (PDF بس دلوقتي — أقصى 10MB).

Response `202`:
```json
{
  "uploadId": "upl_01H...",
  "status": "parsing",
  "stages": [
    { "key": "reading", "text": "بنقرا الملف..." },
    { "key": "analyzing", "text": "بنحلل خبراتك ومهاراتك..." },
    { "key": "checking", "text": "بنشوف الناقص إيه..." }
  ]
}
```

### `GET /cv/uploads/:uploadId`

الفرونت بيسأل عليه كل ثانية.

```json
{
  "uploadId": "upl_01H...",
  "status": "done",
  "currentStage": "checking",
  "analysis": {
    "cv": {
      "basic": { "name": "Ahmed Hassan", "title": "Sales & Accounts Associate", "phone": "+20 101 234 5678", "email": "ahmed.hassan@email.com", "location": "Nasr City, Cairo" },
      "experience": [
        { "title": "Sales & Accounts Associate", "company": "Mobile Store, Nasr City", "start": "03/2023", "end": "03/2025", "bullets": ["Handled 40+ daily customer interactions..."] }
      ],
      "projects": [],
      "education": [{ "degree": "Bachelor of Commerce – Accounting", "school": "Ain Shams University", "year": "2023" }],
      "certificates": [{ "name": "Advanced Microsoft Excel", "date": "2024" }],
      "skills": [{ "name": "Microsoft Excel", "level": "advanced" }],
      "languages": [{ "name": "English", "level": "intermediate" }]
    },
    "sectionConfidence": { "basic": "high", "experience": "high", "projects": "n/a", "education": "high", "certificates": "high", "skills": "high", "languages": "low" },
    "seniority": "mid",
    "yearsOfExperience": 2,
    "skills": {
      "technical": [{ "name": "Microsoft Excel", "level": "advanced", "yearsUsed": 2 }],
      "tools": [],
      "soft": [{ "name": "Customer Service", "level": "advanced", "yearsUsed": null }]
    },
    "domains": ["retail", "customer-service"],
    "strengths": ["خبرة واضحة في خدمة العملاء لمدة سنتين"],
    "gaps": ["مفيش شهادات أو كورسات تقنية مذكورة"],
    "qualityIssues": [{ "type": "no_metrics", "description": "خبراتك متذكرش أرقام، زي عدد العملاء أو نسبة تحسين" }],
    "overallScore": 62,
    "scoreReason": "سيرة ذاتية واضحة بس محتاجة أرقام وتفاصيل أكتر في الخبرة"
  }
}
```

`status`: `parsing` · `done` · `failed` (ومعاها `error`). لو `failed`، مفيش `analysis`.

`sectionConfidence`: لكل قيمة من `SectionId` — `high` (السكشن اتلقى كامل وهيتحفظ في الـ CV أوتوماتيك من غير ما اليوزر يأكده بنفسه)، `low` (ناقص أو مش واضح، هيتسأل عنه في المحادثة)، `n/a` (مش منطبق، زي `experience` لما الـ CV كله `projects`).

بعد `done` الفرونت يبدأ محادثة بـ `mode: "upload"` و`uploadId`.

**ثوابت التحليل:**
- `Seniority`: `junior` · `mid` · `senior`
- `SectionConfidence`: `high` · `low` · `n/a`
- `QualityIssueType`: `employment_gap` · `weak_bullets` · `no_metrics` · `ats_formatting` · `inconsistent_dates` · `contact_missing` · `generic_summary` · `other`

---

## 5. الـ CV

### `GET /cv`

الـ CV الحالي للجهاز، أو `404`. بيرجع حتى لو لسه ناقص (`isComplete: false`).

```json
{
  "cvId": "cv_01H...",
  "isComplete": false,
  "updatedAt": "2026-09-23T20:11:00Z",
  "confirmedSections": ["basic", "experience"],
  "name": "Ahmed Hassan",
  "title": "Sales & Accounts Associate",
  "contact": { "phone": "+20 101 234 5678", "email": "ahmed.hassan@email.com", "location": "Nasr City, Cairo" },
  "summary": "Commerce graduate with 2 years...",
  "experience": [
    { "title": "Sales & Accounts Associate", "company": "Mobile Store, Nasr City", "start": "03/2023", "end": "03/2025", "bullets": ["Handled 40+ daily customer interactions..."] }
  ],
  "projects": [],
  "education": [{ "degree": "Bachelor of Commerce – Accounting", "school": "Ain Shams University", "year": "2023" }],
  "certificates": [{ "name": "Advanced Microsoft Excel", "date": "2024" }],
  "skills": [{ "name": "Microsoft Excel", "level": "advanced" }],
  "languages": [{ "name": "English", "level": "intermediate" }]
}
```

أي section فاضية بترجع `[]` مش `null`.

### `PATCH /cv`

تعديل section أو أكتر من شاشة المراجعة. الـ body فيه الحقول المتغيرة بس، والرد هو الـ CV كامل بنفس شكل `GET /cv`.

```json
{ "skills": [{ "name": "Microsoft Excel", "level": "expert" }] }
```

### `POST /cv/pdf`

Response `200`: `application/pdf` (نص حقيقي مش صورة)
Header: `Content-Disposition: attachment; filename="Ahmed-Hassan-CV.pdf"`

الـ PDF بيتعمل على السيرفر بس — نفس المولّد اللي بيعمل الـ CV المتظبط لكل تقديم (§7)، فمفيش غير نسخة واحدة من شكل الـ CV.

---

## 6. التفضيلات ومطابقة الوظايف

**ثوابت:**
- `WorkType`: `on_site` · `hybrid` · `remote`
- `EmploymentType`: `full_time` · `part_time` · `shifts` · `field`
- `RoleMatch`: `exact` (نفس الدور اللي في الـ CV) · `adjacent` (دور قريب من نفس المجموعة) · `related` (الـ CV مش متطابق مع دور معروف، فالمطابقة بالتشابه بس)
- `ApplyMethod`: `email` · `external`
- `MatchesStatus`: `ready` · `searching`
- الدول اللي بنجيب وظايفها: مصر `EG` · السعودية `SA` · الإمارات `AE` · ألمانيا `DE`.
- المدينة كود بحروف صغيرة — مصر: `cairo` · `giza` · `alexandria` — السعودية: `riyadh` · `jeddah` · `dammam` — الإمارات: `dubai` · `abu_dhabi` · `sharjah` — ألمانيا: `berlin` · `munich` · `hamburg` · `frankfurt` · `cologne`. اسم المدينة بالعربي مسؤولية الفرونت.

### `PUT /preferences`

تفضيلات البحث عن وظايف للجهاز. بيستبدل التفضيلات كلها كل مرة.

Request:
```json
{ "country": "EG", "city": "cairo", "workTypes": ["on_site", "hybrid"], "willingToRelocate": false }
```
- `country`: كود دولة من حرفين كبار (ISO 3166)، أو `"worldwide"` (أي مكان في العالم). دولة مش من الدول اللي بنجيب وظايفها (فوق) بتتحفظ عادي، بس `GET /jobs/matches` بيرجع `jobs: []` — متعرضهاش كاختيار.
- `city`: كود مدينة، أو `null` = أي مكان في الدولة. لازم `null` مع `"worldwide"`.
- `workTypes`: قيمة واحدة على الأقل من `WorkType`، من غير تكرار.
- `willingToRelocate`: اختياري (default `false`) — بيتحفظ بس، مش فلتر.

Response `200`: نفس الشكل.

لو الجهاز عمره ما حفظ تفضيلات، المطابقة بتستخدم: دولة الجهاز (`region`)، أي مدينة، كل أنواع الشغل.

### `GET /jobs/matches`

الوظايف المناسبة للـ CV الحالي حسب التفضيلات المحفوظة.

Response `200`:
```json
{
  "status": "ready",
  "preferences": { "country": "EG", "city": null, "workTypes": ["on_site", "hybrid", "remote"], "willingToRelocate": false },
  "jobs": [
    {
      "id": "job_01H...",
      "title": "Junior Accountant",
      "company": "Nile Trading Co.",
      "location": "Nasr City, Cairo",
      "locations": ["Nasr City, Cairo"],
      "country": "EG",
      "city": "cairo",
      "employmentType": "full_time",
      "workType": "on_site",
      "postedAt": "2026-09-23T10:00:00Z",
      "match": 94,
      "roleMatch": "exact",
      "whyMatch": ["خبرة Excel متقدمة", "بكالوريوس تجارة محاسبة"],
      "gaps": ["مطلوب معرفة بسيستم ERP"],
      "apply": { "method": "email", "url": "https://...", "email": "careers@nile.example.com" },
      "application": null
    }
  ]
}
```

- `preferences`: التفضيلات اللي اتفلتر بيها فعلًا (المحفوظة أو الـ default).
- `status: "searching"`: لسه بنجمع وظايف مجال الـ CV في الدولة دي، أو لسه بنقيّم جزء منها — `jobs` ممكن تكون ناقصة أو فاضية، اسأل تاني بعد كام ثانية (النتايج بتوصل على دفعات، أول دفعة بتيجي في أول رد). `"ready"`: دي كل الوظايف المتاحة دلوقتي.
- الترتيب: بالـ `match` من الأعلى. لو اتنين نفس الـ `match`، الـ `exact` قبل الـ `adjacent` قبل الـ `related`.
- `match` من 0 لـ 100. الوظايف اللي أقل من 40 مش بترجع.
- `whyMatch` (سبب واحد على الأقل) و`gaps` (ممكن `[]`) بالمصري، 3 بالكتير لكل واحدة.
- `company` و`location` ممكن يبقوا `null`. `city`: كود أو `null` لو الوظيفة مش مربوطة بمدينة معروفة.
- `locations`: كل الأماكن اللي الوظيفة دي منشورة فيها. نفس الوظيفة (نفس الشركة ونفس المسمى) المنشورة في كذا مدينة بترجع **مرة واحدة** بكل أماكنها، وأولهم `location` بتاعها. `[]` لو مفيش مكان.
- الوظيفة اللي مكانها في دولة تانية غير الدولة اللي بندوّر فيها (مثلًا إعلان في النمسا جاي مع وظايف ألمانيا) مش بترجع خالص.
- `whyMatch` متراجع في الكود: كل سبب لازم يذكر حاجة موجودة فعلًا في الـ CV (مهارة، أداة، شهادة، مسمى، سنين خبرة)، والسبب اللي فيه حاجة مش في الـ CV بيتشال. الوظيفة اللي مفضلهاش ولا سبب مش بترجع.
- `apply.url` لينك الإعلان دايمًا. `apply.email` موجود بس لما `method: "email"`، وإلا `null`.
- `application`: تقديم الجهاز على الوظيفة دي لو موجود — `{ "id": "app_...", "status": "sent" }` (`ApplicationStatus`، §7) — أو `null` لو عمره ما قدّم عليها. الوظيفة اللي عندها تقديم حالته غير `failed` مينفعش تتقدم تاني.
- أول مرة لكل نسخة من الـ CV الـ AI بيقيّم الوظايف على دفعات: أول رد فيه أول دفعة مع `status: "searching"`، والباقي بيظهر في الردود اللي بعدها. بعد كده من الكاش، حتى لو التفضيلات اتغيرت. تعديل الـ CV بيعيد التقييم أوتوماتيك.
- وصف الوظيفة ممكن يكون بأي لغة (مثلًا ألماني)، بس `whyMatch` و`gaps` دايمًا بالمصري.

أخطاء: `404 NOT_FOUND` لو الجهاز معندوش CV · `400 INVALID_REQUEST` لو الـ CV مفيهوش مسمى وظيفي ولا خبرات ولا مهارات · `503 AI_UNAVAILABLE` (retryable) لو التقييم فشل.

---

## 7. التقديم

التقديم حسب `apply.method` بتاع الوظيفة، بطريقتين صريحتين:
- **`email` — بنقدّم فعلًا:** الـ CV بيتظبط على الوظيفة (ترتيب وصياغة الـ bullets والمهارات، من غير أي معلومة مش موجودة في الـ CV)، وبيتعمل PDF، وبيتبعت للشركة بإيميل من اليوزر (الرد بيروح لإيميل اليوزر نفسه). الحالة `sent`.
- **`external` — بنجهّز واليوزر يكمّل:** نفس ظبط الـ CV، والـ PDF بيبقى متاح للتحميل، واليوزر يقدّم بنفسه من موقع الإعلان. الحالة `prepared` — **مش تقديم** — وبتبقى `opened` لما الفرونت يبلّغ إن اليوزر فتح الإعلان.

**ثوابت:**
- `ApplicationStatus`: `processing` (لسه بيتجهز) · `sent` · `prepared` · `opened` · `failed`
- `ApplicationStage` (بس وهو `processing`): `tailoring` (بنظبط الـ CV) · `sending` (بنبعت الإيميل)
- `ApplicationBatchStatus`: `processing` · `done`

**شكل التقديم (`Application`):**
```json
{
  "id": "app_01H...",
  "batchId": "apb_01H...",
  "jobId": "job_01H...",
  "job": { "title": "Accountant", "company": "Nile Trading Co.", "location": "Giza, Egypt", "url": "https://...", "email": "careers@nile.example.com" },
  "method": "email",
  "status": "sent",
  "stage": null,
  "cvAvailable": true,
  "cvTailored": true,
  "error": null,
  "createdAt": "2026-09-25T12:00:00Z",
  "updatedAt": "2026-09-25T12:00:09Z",
  "sentAt": "2026-09-25T12:00:09Z",
  "preparedAt": null,
  "openedAt": null,
  "failedAt": null
}
```
- `job`: نسخة من بيانات الوظيفة وقت التقديم. `job.email` = الإيميل اللي اتبعتله (بس لـ `email`)، وإلا `null`. `jobId` ممكن يبقى `null` لو الوظيفة اتمسحت.
- `cvAvailable`: الـ CV المتظبط للوظيفة دي جاهز للتحميل (`GET /applications/:id/cv`).
- `cvTailored`: `false` لو ظبط الـ CV مغيّرش حاجة واتبعت/اتجهز زي ما اليوزر كتبه.
- بيانات التواصل في الـ CV المتظبط بتتكتب بالشكل اللي شركة في بلد الوظيفة تفهمه، من غير أي معلومة جديدة: موبايل مصري محلي بيبقى دولي (`0101 234 5678` → `+20 101 234 5678`)، والمكان بياخد اسم دولته لو الوظيفة في دولة تانية (`Nasr City, Cairo` → `Nasr City, Cairo, Egypt`). الإيميل للشركة دايمًا بالإنجليزي.
- `error`: `{ "message": "..." }` بالمصري لما `status: "failed"`، وإلا `null`.

### `POST /applications`

Request:
```json
{ "jobIds": ["job_01H...", "job_02H..."] }
```
من 1 لـ 20 id، من غير تكرار. الفرونت لازم يمنع اختيار أكتر من 20 (والـ default selection كمان مايعديش 20).

Response `202` — بيرجع فورًا والشغل بيكمّل في الخلفية (زي تحليل الـ CV):
```json
{
  "batchId": "apb_01H...",
  "status": "processing",
  "progress": { "total": 2, "completed": 0 },
  "sent": [],
  "prepared": [],
  "failed": [],
  "processing": [ { "...": "Application" } ],
  "alreadyApplied": []
}
```
- **مفيش تقديم مرتين على نفس الوظيفة:** وظيفة ليها تقديم قبل كده (`processing`/`sent`/`prepared`/`opened`) بترجع في `alreadyApplied` ومبتتعملش تاني. التقديم الـ `failed` بس هو اللي بيتعاد لو اتطلب تاني (بنفس الـ `id`).
- `progress.total` = عدد اللي بتتعمل في الطلب ده (من غير `alreadyApplied`).

أخطاء: `404 NOT_FOUND` لو الجهاز معندوش CV · `400 INVALID_REQUEST` لو فيه `jobId` مش موجود.

### `GET /applications/batches/:batchId`

الفرونت بيسأل عليه كل ثانية ونص لحد `status: "done"`. نفس شكل رد `POST /applications`.
- `sent`: اتبعتت للشركة فعلًا.
- `prepared`: جاهزة ومستنية اليوزر يكمّل من الموقع (فيها `prepared` و`opened`).
- `failed`: فيها `error.message`.
- `processing`: لسه شغالة — `stage` بيقول وصلت فين.

### `GET /applications`

كل تقديمات الجهاز، الأحدث الأول:
```json
{ "applications": [ { "...": "Application" } ] }
```

### `POST /applications/:id/opened`

الفرونت بيبلّغ إن اليوزر فتح إعلان وظيفة `external`. Response `200`: الـ `Application` بحالة `opened` (لو اتبعت أكتر من مرة، أول `openedAt` بيفضل).
أخطاء: `400 INVALID_REQUEST` لو التقديم `email`، أو لسه `processing`/`failed` · `404 NOT_FOUND`.

### `GET /applications/:id/cv`

Response `200`: `application/pdf` — الـ CV المتظبط اللي اتبعت أو اتجهز للوظيفة دي بالظبط (نص حقيقي، نفس شكل `POST /cv/pdf`).
Header: `Content-Disposition: attachment; filename="Ahmed-Hassan-CV.pdf"`
أخطاء: `404 NOT_FOUND` لو التقديم مش موجود أو الـ CV لسه بيتجهز (`cvAvailable: false`).

---

## متغيرش من غير اتفاق

- أسامي الحقول وشكل الـ nesting.
- قيم `SectionId` و`Level` و`MessageType` و`WorkType` و`EmploymentType` و`RoleMatch` و`ApplyMethod` و`MatchesStatus` و`ApplicationStatus` و`ApplicationStage` و`ApplicationBatchStatus` وأكواد المدن وأكواد الأخطاء.
- أسامي أحداث الـ SSE وترتيبها.
- شكل الخطأ الموحد.
