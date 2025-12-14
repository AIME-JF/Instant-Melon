

async function testAi() {
    const text = "今天买了一个西瓜，结果切开是白的，气死我了。找老板退货，老板说这是新品种白玉西瓜，比红的还贵。";
    console.log("Input:", text);

    try {
        const response = await fetch("http://localhost:3000/api/ai?t=" + Date.now(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "扮演一个毒舌故事总结家，喜欢用30字以内的精炼中文语句总结锐评故事" },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        if (data.choices && data.choices[0]) {
            console.log("Output:", data.choices[0].message.content);
        } else {
            console.log("Full Response:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testAi();
