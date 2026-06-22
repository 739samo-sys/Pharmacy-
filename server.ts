import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization for Gemini AI SDK
let aiInstance: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your secrets or .env file.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// 1. API: Generate Feasibility Study Text with Gemini
app.post("/api/generate-study", async (req, res) => {
  try {
    const { inputs, results } = req.body;
    if (!inputs || !results) {
      res.status(400).json({ error: "Missing study inputs or financial results" });
      return;
    }

    const ai = getAIClient();

    // Custom prompt to generate a highly detailed and professional study in Arabic
    const prompt = `
أنت مستشار مالي وإداري خبير في قطاع الرعاية الصحية والصيدليات.
المطلوب كتابة دراسة جدوى تفصيلية واحترافية باللغة العربية لإنشاء صيدلية جديدة تسمى "${inputs.pharmacyName}".

--- البيانات الأساسية للمشروع ---
- اسم الصيدلية: ${inputs.pharmacyName}
- الموقع الاستراتيجي: ${inputs.locationCity} (${inputs.locationType === 'commercial' ? 'شارع تجاري رئيسي' : inputs.locationType === 'residential' ? 'منطقة سكنية كثيفة' : inputs.locationType === 'near_hospital' ? 'بالقرب من مركز طبي أو مستشفى' : 'منطقة ريفية/شبه حضرية'})
- مساحة المحل: ${inputs.sizeSqm} متر مربع.
- إجمالي رأس المال التأسيسي المطلوب: $${results.totalStartupCapital.toLocaleString()} دولار أمريكي
- إجمالي المصاريف التشغيلية الشهرية: $${results.monthlyOperatingCost.toLocaleString()} دولار أمريكي
- المبيعات الشهرية المتوقعة: $${results.estimatedMonthlySales.toLocaleString()} دولار أمريكي
- هامش الربح الإجمالي المتوقع: $${results.estimatedMonthlyRevenue.toLocaleString()} دولار أمريكي شهرياً
- صافي الربح الشهري المتوقع: $${results.estimatedMonthlyNetProfit.toLocaleString()} دولار أمريكي
- العائد على الاستثمار الملكي (ROI): %${results.roi} سنوياً
- فترة الاسترداد المتوقعة: ${results.paybackPeriodMonths} شهراً
- معدل تحول الزوار اليومي: من زحام متوسط قدره ${inputs.revenue.dailyFootTraffic} عابر بالشارع، يدخل ويشتري حوالي ${results.estimatedDailyCustomers} زبون يومياً بمتوسط إنفاق $${inputs.revenue.averageBasketSize} للزبون.

--- هيكل المنتجات والمبيعات ---
- نسبة الأدوية والعقاقير الطبية: %${inputs.revenue.medicineShare} من المبيعات مع هامش ربح %${inputs.revenue.medicineMargin}
- نسبة مستحضرات التجميل ومنتجات العناية بالأم والطفل: %${inputs.revenue.cosmeticsShare} من المبيعات مع هامش ربح %${inputs.revenue.cosmeticsMargin}

المطلوب صياغة تقرير دراسة الجدوى بأسلوب رسمي واحترافي مقسم بدقة إلى الأجزاء التالية (أجب ككائن JSON نظيف ومتوافق بنسبة 100% مع البنية المكتوبة أدناه):

ملاحظة هامة: يجب أن تكون الإجابة عبارة عن JSON صالح فقط لكي نتمكن من تحليلها برمجياً. لا تكتب أي مقدمات أو تعليقات خارج كود الـ JSON.

بنية الـ JSON المطلوبة:
{
  "executiveSummary": "نص تفصيلي ملخص للتنفيذي يتناول أهمية ومؤشرات نجاح الصيدلية في هذا الموقع ومبررات الاستثمار والتوقعات المالية العامة بشكل جاذب للمستثمرين.",
  "swotAnalysis": {
    "strengths": ["نقطة قوة 1 موضوعية للموقع والمساحة", "نقطة قوة 2", "نقطة قوة 3"],
    "weaknesses": ["نقطة ضعف 1 مثل التمويل أو المنافسة", "نقطة ضعف 2"],
    "opportunities": ["فرصة 1 في السوق المحلي لهذه المنطقة", "فرصة 2"],
    "threats": ["تهديد محتمل 1 مثل تقلبات الأسعار أو السلاسل الكبرى", "تهديد محتمل 2"]
  },
  "marketingStrategy": "خطة تسويق تفصيلية (تشمل التسويق الميداني، توفير عينات، افتتاح مميز، بطاقات الولاء، التوصيل المنزلي، استهداف الأطباء المجاورين).",
  "regulatoryCompliance": "دليل قانوني وتنظيمي مفصل لفتح الصيدلية في البلد المتوقع (ترخيص البلدية، مواصفات وزارة الصحة للمساحة والارتفاع، ترخيص الدفاع المدني، شهادة الصيدلي المسؤول وتراخيص نقابة صيادلة البلد).",
  "staffingPlan": "خطة الموارد البشرية وتوزيع المناوبات والمسؤوليات (تحدث عن الصيدلي المسؤول المساعد، والعمالة المساعدة، وساعات العمل المقترحة لتغطية الأيام كاملة).",
  "riskMitigation": "خطة إدارة وتخفيف المخاطر (مخاطر انتهاء صلاحية الأدوية، تذبذب المبيعات، تحديات التوريد، والاحتفاظ بالعملاء وطرق معالجتها بنماذج أعمال حديثة).",
  "finalRecommendation": "التوصية النهائية للمستشار وتقييم جدوى الاستثمار النهائي بكل صراحة وأمانة وفقاً للأرقام المرصودة."
}
`;

    // We can use gemini-2.5-flash as the fallback model, or gemini-3.5-flash if available
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "{}";
    const reportData = JSON.parse(responseText);

    res.json(reportData);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI Feasibility report." });
  }
});

// 2. API: Create Google Doc using OAuth token
app.post("/api/export-gdoc", async (req, res) => {
  try {
    const { token, title, content } = req.body;
    if (!token) {
      res.status(400).json({ error: "Missing Google User Authentication token" });
      return;
    }

    if (!content) {
      res.status(400).json({ error: "No content provided to export" });
      return;
    }

    // A. Create the base Document on Google Drive
    const driveResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: title || "دراسة جدوى صيدلية - تصدير تلقائي",
        mimeType: "application/vnd.google-apps.document"
      })
    });

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      throw new Error(`Drive File Creation Failed: ${errText}`);
    }

    const driveData = await driveResponse.json();
    const documentId = driveData.id;

    // B. Build the document insertions
    // Google Docs batchUpdate inserts text at index 1 in reverse order or sequentially
    // Let's create a beautiful document layout!
    const requests: any[] = [];

    // Let's construct a massive body text with clean formatting
    let docBody = "";
    docBody += `دراسة الجدوى الشاملة لتأسيس "${content.inputs.pharmacyName}"\n`;
    docBody += `==============================================\n`;
    docBody += `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')} | العملة المعتمدة: الدولار الأمريكي ($)\n\n`;
    
    docBody += `1. المؤشرات المالية الرئيسية:\n`;
    docBody += `-------------------------------\n`;
    docBody += `• إجمالي رأس المال المطلوب للتأسيس: $${Number(content.results.totalStartupCapital).toLocaleString()} دولار\n`;
    docBody += `• المصاريف التشغيلية الشهرية: $${Number(content.results.monthlyOperatingCost).toLocaleString()} دولار/شهراً\n`;
    docBody += `• المبيعات الشهرية المتوقعة: $${Number(content.results.estimatedMonthlySales).toLocaleString()} دولار/شهراً\n`;
    docBody += `• صافي الأرباح الشهرية الصافية: $${Number(content.results.estimatedMonthlyNetProfit).toLocaleString()} دولار/شهراً\n`;
    docBody += `• صافي الأرباح السنوية: $${Number(content.results.annualNetProfit).toLocaleString()} دولار/سنوياً\n`;
    docBody += `• العائد السنوي على الاستثمار (ROI): %${content.results.roi}\n`;
    docBody += `• فترة استرداد رأس المال: ${content.results.paybackPeriodMonths} شهراً (${(content.results.paybackPeriodMonths / 12).toFixed(1)} سنة)\n\n`;

    docBody += `2. هيكل رأس المال التأسيسي بالتفصيل:\n`;
    docBody += `------------------------------------\n`;
    docBody += `• إيجار المحل السنوي الأساسي: $${Number(content.inputs.startup.rentAnnual).toLocaleString()} دولار\n`;
    docBody += `• أعمال الديكور والأرفف واللوحة الخارجية: $${Number(content.inputs.startup.renovation).toLocaleString()} دولار\n`;
    docBody += `• أجهزة التبريد، المكيفات، وثلاجة الأدوية: $${Number(content.inputs.startup.coolingSystem).toLocaleString()} دولار\n`;
    docBody += `• نظام الصيدلية، الكمبيوترات، والباركود: $${Number(content.inputs.startup.softwareLicense).toLocaleString()} دولار\n`;
    docBody += `• الرسوم القانونية، التراخيص الحكومية والبلدية: $${Number(content.inputs.startup.legalLicenses).toLocaleString()} دولار\n`;
    docBody += `• التسويق وحملة الإفتتاح والعلامة التجارية: $${Number(content.inputs.startup.brandingMarketing).toLocaleString()} دولار\n`;
    docBody += `• المخزون البدئي للأدوية والعقاقير: $${Number(content.inputs.startup.initialMedsInventory).toLocaleString()} دولار\n`;
    docBody += `• المخزون البدئي للتجميل والعناية الشخصية: $${Number(content.inputs.startup.initialCosmeticsInventory).toLocaleString()} دولار\n`;
    docBody += `• مخزون الأجهزة الطبية والمستلزمات المتنوعة: $${Number(content.inputs.startup.initialMiscInventory).toLocaleString()} دولار\n`;
    docBody += `• رأس مال احتياطي وطوارئ (السيولة النقدية): $${Number(content.inputs.startup.contingencyCash).toLocaleString()} دولار\n\n`;

    docBody += `3. المصاريف التشغيلية الشهرية المتكررة:\n`;
    docBody += `---------------------------------------\n`;
    docBody += `• رواتب الصيادلة (العدد: ${content.inputs.operating.pharmacistCount}): $${(content.inputs.operating.pharmacistCount * content.inputs.operating.pharmacistSalary).toLocaleString()} دولار\n`;
    docBody += `• رواتب العمالة المساعدة والخدمات (العدد: ${content.inputs.operating.helperCount}): $${(content.inputs.operating.helperCount * content.inputs.operating.helperSalary).toLocaleString()} دولار\n`;
    docBody += `• نصيب الإيجار الشهري المحتسب: $${(content.inputs.startup.rentAnnual / 12).toLocaleString()} دولار\n`;
    docBody += `• تكاليف المرافق (الكهرباء والإنترنت والمياه): $${Number(content.inputs.operating.utilities).toLocaleString()} دولار\n`;
    docBody += `• التسويق والدعاية الشهرية المستمرة: $${Number(content.inputs.operating.marketingMonthly).toLocaleString()} دولار\n`;
    docBody += `• صيانة دورية ومصاريف نقدية نثريّة: $${Number(content.inputs.operating.maintenanceMisc).toLocaleString()} دولار\n\n`;

    if (content.aiReport) {
      docBody += `4. الملخص التنفيذي ورؤية المشروع (AI):\n`;
      docBody += `---------------------------------------\n`;
      docBody += `${content.aiReport.executiveSummary}\n\n`;

      docBody += `5. تحليل بيئة الصيدلية الرباعي (SWOT):\n`;
      docBody += `---------------------------------------\n`;
      docBody += `[نقاط القوة]\n`;
      content.aiReport.swotAnalysis.strengths.forEach((s: string) => { docBody += `   - ${s}\n`; });
      docBody += `\n[نقاط الضعف]\n`;
      content.aiReport.swotAnalysis.weaknesses.forEach((w: string) => { docBody += `   - ${w}\n`; });
      docBody += `\n[الفرص الواعدة]\n`;
      content.aiReport.swotAnalysis.opportunities.forEach((o: string) => { docBody += `   - ${o}\n`; });
      docBody += `\n[التهديدات والمحاذير]\n`;
      content.aiReport.swotAnalysis.threats.forEach((t: string) => { docBody += `   - ${t}\n`; });
      docBody += `\n`;

      docBody += `6. الخطة التسويقية والجماهيرية المستهدفة:\n`;
      docBody += `---------------------------------------\n`;
      docBody += `${content.aiReport.marketingStrategy}\n\n`;

      docBody += `7. التوافق والالتزام التنظيمي والقانوني:\n`;
      docBody += `---------------------------------------\n`;
      docBody += `${content.aiReport.regulatoryCompliance}\n\n`;

      docBody += `8. خطة التشغيل وإدارة الموارد البشرية:\n`;
      docBody += `---------------------------------------\n`;
      docBody += `${content.aiReport.staffingPlan}\n\n`;

      docBody += `9. استراتيجية تخفيف وإدارة المخاطر:\n`;
      docBody += `---------------------------------------\n`;
      docBody += `${content.aiReport.riskMitigation}\n\n`;

      docBody += `10. التوصية الاستشارية النهائية والتقييم:\n`;
      docBody += `-----------------------------------------\n`;
      docBody += `${content.aiReport.finalRecommendation}\n\n`;
    }

    docBody += `==============================================\n`;
    docBody += `تم إعداد هذه الدراسة وتصديرها آلياً بواسطة تطبيق دراسات الجدوى الذكية.\n`;

    // Docs batchUpdate payload
    requests.push({
      insertText: {
        text: docBody,
        location: { index: 1 }
      }
    });

    const docUpdateResponse = await fetch(`https://www.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requests })
    });

    if (!docUpdateResponse.ok) {
      const errText = await docUpdateResponse.text();
      throw new Error(`Google Docs Write Content Failed: ${errText}`);
    }

    // Returns the link of the created Google Doc so user can click it!
    res.json({
      success: true,
      documentId: documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`
    });
  } catch (error: any) {
    console.error("Google Docs Export Error:", error);
    res.status(500).json({ error: error.message || "Failed to create or format the Google Document." });
  }
});

// Serve static assets in production, otherwise mount Vite
const createServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully active on port ${PORT}`);
  });
};

createServer();
