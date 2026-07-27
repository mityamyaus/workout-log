export interface Phrase {
  line1: string;
  line2Prefix: string;
  line2Accent: string;
}

export const PHRASES: Phrase[] = [
  { line1: "Давай", line2Prefix: "за ", line2Accent: "работу." },
  { line1: "Никаких", line2Prefix: "", line2Accent: "отговорок." },
  { line1: "Сделай", line2Prefix: "", line2Accent: "сегодня." },
  { line1: "Слабость", line2Prefix: "", line2Accent: "временна." },
  { line1: "Боль —", line2Prefix: "это ", line2Accent: "рост." },
  { line1: "Начни", line2Prefix: "прямо ", line2Accent: "сейчас." },
  { line1: "Ты", line2Prefix: "сильнее ", line2Accent: "вчера." },
  { line1: "Никто", line2Prefix: "не сделает ", line2Accent: "за тебя." },
  { line1: "Тело", line2Prefix: "строится ", line2Accent: "сегодня." },
  { line1: "Дисциплина", line2Prefix: "побеждает ", line2Accent: "мотивацию." },
  { line1: "Один", line2Prefix: "подход ", line2Accent: "ближе." },
  { line1: "Не пропускай", line2Prefix: "", line2Accent: "тренировку." },
  { line1: "Будь", line2Prefix: "лучшей ", line2Accent: "версией." },
  { line1: "Пот", line2Prefix: "решает ", line2Accent: "всё." },
  { line1: "Вперёд,", line2Prefix: "без ", line2Accent: "пауз." },
  { line1: "Каждый день —", line2Prefix: "шанс ", line2Accent: "расти." },
  { line1: "Полностью", line2Prefix: "", line2Accent: "выложись." },
  { line1: "Результат", line2Prefix: "не ", line2Accent: "ждёт." },
  { line1: "Тренируйся", line2Prefix: "как ", line2Accent: "чемпион." },
  { line1: "Превзойди", line2Prefix: "вчерашнего ", line2Accent: "себя." },
  { line1: "Никаких", line2Prefix: "выходных ", line2Accent: "мыслям." },
  { line1: "Сила", line2Prefix: "внутри ", line2Accent: "тебя." },
  { line1: "Соберись", line2Prefix: "и ", line2Accent: "работай." },
  { line1: "Комфорт —", line2Prefix: "враг ", line2Accent: "прогресса." },
  { line1: "Ты", line2Prefix: "это ", line2Accent: "можешь." },
  { line1: "Действуй,", line2Prefix: "а не ", line2Accent: "мечтай." },
  { line1: "Прогресс", line2Prefix: "любит ", line2Accent: "упорство." },
  { line1: "Стань", line2Prefix: "", line2Accent: "железным." },
  { line1: "Здесь", line2Prefix: "начинается ", line2Accent: "сила." },
  { line1: "Не сдавайся", line2Prefix: "— ", line2Accent: "дожми." },
  { line1: "Тренировка", line2Prefix: "ждёт ", line2Accent: "тебя." },
];

export function getTodaysPhrase(): Phrase {
  const day = new Date().getDate();
  return PHRASES[(day - 1) % PHRASES.length];
}
