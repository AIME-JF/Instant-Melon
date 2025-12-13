import { useState, useEffect, useLayoutEffect } from 'react';

const useTypewriter = (text, speed = 30, startDelay = 300) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);

    useLayoutEffect(() => {
        setIsTyping(true);
        setDisplayedText("");
    }, [text]);

    useEffect(() => {
        if (!text) {
            setIsTyping(false);
            return;
        }
        let timeoutId;
        let currentIndex = 0;
        const startTimeout = setTimeout(() => {
            const typeChar = () => {
                if (currentIndex < text.length) {
                    setDisplayedText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                    const char = text[currentIndex - 1];
                    const delay = (char === '，' || char === '。' || char === '？' || char === '！') ? speed * 8 : speed;
                    timeoutId = setTimeout(typeChar, delay);
                } else {
                    setIsTyping(false);
                }
            };
            typeChar();
        }, startDelay);
        return () => { clearTimeout(startTimeout); clearTimeout(timeoutId); };
    }, [text, speed, startDelay]);

    return { displayedText, isTyping };
};

export default useTypewriter;
