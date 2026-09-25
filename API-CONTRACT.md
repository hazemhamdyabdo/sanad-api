# API Contract — سَنَد

المصدر الوحيد لشكل الـ endpoints. نسخة متطابقة في `sanad-api` و`sanad-client`.

**قاعدة:** الفرونت متبني على الشكل ده بـ mock data. الباك يلتزم بيه حرفيًا. أي تغيير يتناقش ويتعدل في النسختين مع بعض.

**Phase 1** = الجهاز، والمحادثة، والـ CV. الوظايف والتقديم في نسخة جاية.

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

`message` بالمصري لأن الفرونت بيعرضه زي ما هو.

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

---

## متغيرش من غير اتفاق

- أسامي الحقول وشكل الـ nesting.
- قيم `SectionId` و`Level` و`MessageType` وأكواد الأخطاء.
- أسامي أحداث الـ SSE وترتيبها.
- شكل الخطأ الموحد.
