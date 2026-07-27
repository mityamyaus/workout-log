export type MuscleGroup =
  | "TRAPS"
  | "FRONT_DELTS"
  | "SIDE_DELTS"
  | "REAR_DELTS"
  | "CHEST"
  | "UPPER_BACK"
  | "BICEPS"
  | "TRICEPS"
  | "FOREARMS"
  | "ABS"
  | "LOWER_BACK"
  | "GLUTES"
  | "HIP_ABDUCTORS"
  | "HIP_ADDUCTORS"
  | "QUADS"
  | "HAMSTRINGS"
  | "CALVES";

export type Equipment =
  | "BARBELL"
  | "DUMBBELL"
  | "EZ_BAR"
  | "SMITH_MACHINE"
  | "MACHINE"
  | "CABLE"
  | "KETTLEBELL"
  | "BODYWEIGHT"
  | "ASSISTED_BODYWEIGHT"
  | "TIME"
  | "CARDIO";

export type BodyPart = "ARMS" | "SHOULDERS" | "CHEST" | "BACK" | "ABS" | "LEGS";

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: Equipment;
  description?: string;
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  TRAPS: "Трапеции",
  FRONT_DELTS: "Передние дельты",
  SIDE_DELTS: "Боковые дельты",
  REAR_DELTS: "Задние дельты",
  CHEST: "Грудь",
  UPPER_BACK: "Спина",
  BICEPS: "Бицепс",
  TRICEPS: "Трицепс",
  FOREARMS: "Предплечья",
  ABS: "Пресс",
  LOWER_BACK: "Низ спины",
  GLUTES: "Ягодицы",
  HIP_ABDUCTORS: "Отводящие бедра",
  HIP_ADDUCTORS: "Приводящие бедра",
  QUADS: "Квадрицепсы",
  HAMSTRINGS: "Бицепс бедра",
  CALVES: "Икры",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL: "Штанга",
  DUMBBELL: "Гантели",
  EZ_BAR: "EZ-штанга",
  SMITH_MACHINE: "Смит-машина",
  MACHINE: "Тренажёр",
  CABLE: "Блок",
  KETTLEBELL: "Гиря",
  BODYWEIGHT: "Свой вес",
  ASSISTED_BODYWEIGHT: "Свой вес (с поддержкой)",
  TIME: "На время",
  CARDIO: "Кардио",
};

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  ARMS: "Руки",
  SHOULDERS: "Плечи",
  CHEST: "Грудь",
  BACK: "Спина",
  ABS: "Пресс",
  LEGS: "Ноги",
};

export const MUSCLE_TO_BODY_PART: Record<MuscleGroup, BodyPart> = {
  BICEPS: "ARMS",
  TRICEPS: "ARMS",
  FOREARMS: "ARMS",
  FRONT_DELTS: "SHOULDERS",
  SIDE_DELTS: "SHOULDERS",
  REAR_DELTS: "SHOULDERS",
  TRAPS: "SHOULDERS",
  CHEST: "CHEST",
  UPPER_BACK: "BACK",
  LOWER_BACK: "BACK",
  ABS: "ABS",
  GLUTES: "LEGS",
  HIP_ABDUCTORS: "LEGS",
  HIP_ADDUCTORS: "LEGS",
  QUADS: "LEGS",
  HAMSTRINGS: "LEGS",
  CALVES: "LEGS",
};

const raw: { name: string; category: MuscleGroup; equipment: Equipment; description: string }[] = [
  { name: "Шраги со штангой", category: "TRAPS", equipment: "BARBELL", description: "Держи штангу перед собой на прямых руках, поднимай плечи строго вверх, без вращения." },
  { name: "Шраги с гантелями", category: "TRAPS", equipment: "DUMBBELL", description: "Гантели вдоль тела, тяни плечи к ушам, задержись на секунду вверху." },
  { name: "Шраги в тренажёре", category: "TRAPS", equipment: "MACHINE", description: "Возьмись за рукояти, поднимай плечи вертикально, не сгибая руки." },
  { name: "Тяга штанги к подбородку", category: "TRAPS", equipment: "BARBELL", description: "Тяни штангу вдоль тела к подбородку, локти веди выше кистей." },
  { name: "Шраги в Смите", category: "TRAPS", equipment: "SMITH_MACHINE", description: "Гриф в опущенных руках, поднимай плечи вверх по фиксированной траектории." },

  { name: "Жим штанги стоя", category: "FRONT_DELTS", equipment: "BARBELL", description: "Штанга на уровне груди, дожми над головой, не прогибаясь в пояснице." },
  { name: "Жим гантелей сидя", category: "FRONT_DELTS", equipment: "DUMBBELL", description: "Спина прижата к скамье, толкай гантели вверх до почти полного выпрямления рук." },
  { name: "Подъём штанги перед собой", category: "FRONT_DELTS", equipment: "BARBELL", description: "Прямыми руками подними штангу перед собой до уровня плеч, опусти медленно." },
  { name: "Подъём гантелей перед собой", category: "FRONT_DELTS", equipment: "DUMBBELL", description: "Поочерёдно поднимай гантели перед собой до уровня плеч, без раскачки." },
  { name: "Жим в Смите сидя", category: "FRONT_DELTS", equipment: "SMITH_MACHINE", description: "Сидя под грифом, жми вверх строго по вертикали." },

  { name: "Махи гантелями в стороны стоя", category: "SIDE_DELTS", equipment: "DUMBBELL", description: "Слегка согнутые руки разводи в стороны до уровня плеч, локти чуть выше кистей." },
  { name: "Махи в стороны в кроссовере", category: "SIDE_DELTS", equipment: "CABLE", description: "Стой боком к блоку, отводи руку в сторону от бедра до уровня плеча." },
  { name: "Разведение рук в тренажёре (дельты)", category: "SIDE_DELTS", equipment: "MACHINE", description: "Разводи рукояти в стороны, работая только плечом, без рывков." },

  { name: "Махи гантелями в наклоне", category: "REAR_DELTS", equipment: "DUMBBELL", description: "Наклонись вперёд, разводи гантели в стороны, сводя лопатки." },
  { name: "Разведение в тренажёре (задние дельты)", category: "REAR_DELTS", equipment: "MACHINE", description: "Грудью к подушке, разводи рукояти назад, сводя лопатки." },
  { name: "Тяга к лицу на канате", category: "REAR_DELTS", equipment: "CABLE", description: "Тяни канат к лицу, разводя локти в стороны выше уровня плеч." },

  { name: "Жим штанги лёжа", category: "CHEST", equipment: "BARBELL", description: "Опускай штангу к нижней части груди, толкай вверх по дуге." },
  { name: "Жим гантелей лёжа", category: "CHEST", equipment: "DUMBBELL", description: "Гантели опускай до уровня груди, локти под углом 45°, жми вверх." },
  { name: "Жим штанги на наклонной скамье", category: "CHEST", equipment: "BARBELL", description: "На скамье под углом 30-45° опускай штангу к верху груди." },
  { name: "Жим гантелей на наклонной скамье", category: "CHEST", equipment: "DUMBBELL", description: "На наклонной скамье жми гантели вверх, акцент на верх груди." },
  { name: "Разведение гантелей лёжа", category: "CHEST", equipment: "DUMBBELL", description: "Слегка согнутыми руками разводи гантели в стороны, чувствуя растяжение груди." },
  { name: "Сведение рук в кроссовере", category: "CHEST", equipment: "CABLE", description: "Своди рукояти перед собой по дуге, сокращая грудные в конце движения." },
  { name: "Жим в Смите лёжа", category: "CHEST", equipment: "SMITH_MACHINE", description: "Лёжа на скамье под грифом, жми вверх по фиксированной траектории." },
  { name: "Жим в тренажёре (грудь)", category: "CHEST", equipment: "MACHINE", description: "Толкай рукояти вперёд, сводя лопатки в начале и разгибая руки в конце." },
  { name: "Отжимания от пола", category: "CHEST", equipment: "BODYWEIGHT", description: "Тело прямой линией, опускайся до угла 90° в локтях, отжимайся вверх." },
  { name: "Отжимания на брусьях", category: "CHEST", equipment: "BODYWEIGHT", description: "Наклони корпус вперёд, опускайся до растяжения груди, выжимайся вверх." },

  { name: "Подтягивания широким хватом", category: "UPPER_BACK", equipment: "BODYWEIGHT", description: "Широкий хват сверху, тяни грудь к перекладине, сводя лопатки." },
  { name: "Тяга штанги в наклоне", category: "UPPER_BACK", equipment: "BARBELL", description: "Наклон корпуса ~45°, тяни штангу к низу живота, сводя лопатки." },
  { name: "Тяга гантели в наклоне", category: "UPPER_BACK", equipment: "DUMBBELL", description: "Упор коленом и рукой в скамью, тяни гантель к поясу другой рукой." },
  { name: "Тяга верхнего блока", category: "UPPER_BACK", equipment: "CABLE", description: "Тяни рукоять к верху груди, локти вниз, сводя лопатки." },
  { name: "Тяга горизонтального блока", category: "UPPER_BACK", equipment: "CABLE", description: "Спина прямая, тяни рукоять к животу, сводя лопатки в конце." },
  { name: "Тяга в тренажёре (спина)", category: "UPPER_BACK", equipment: "MACHINE", description: "Грудью в упор, тяни рукояти к себе, работая спиной, а не руками." },
  { name: "Подтягивания с поддержкой", category: "UPPER_BACK", equipment: "ASSISTED_BODYWEIGHT", description: "Колено на платформе тренажёра снижает вес тела, тяни себя вверх, сводя лопатки." },

  { name: "Подъём штанги на бицепс", category: "BICEPS", equipment: "BARBELL", description: "Локти прижаты к корпусу, сгибай руки до полного сокращения бицепса." },
  { name: "Подъём гантелей на бицепс", category: "BICEPS", equipment: "DUMBBELL", description: "Сгибай руки поочерёдно или вместе, не раскачивая корпус." },
  { name: "Подъём EZ-штанги на бицепс", category: "BICEPS", equipment: "EZ_BAR", description: "Изогнутый гриф снижает нагрузку на запястья, сгибай руки без рывков." },
  { name: "Молотковые сгибания", category: "BICEPS", equipment: "DUMBBELL", description: "Держи гантели нейтральным хватом (ладони друг к другу), сгибай руки." },
  { name: "Сгибание рук на блоке", category: "BICEPS", equipment: "CABLE", description: "Постоянное натяжение троса, сгибай руки, не отводя локти назад." },
  { name: "Сгибание рук в тренажёре", category: "BICEPS", equipment: "MACHINE", description: "Плечи зафиксированы подушкой, сгибай руки в полную амплитуду." },

  { name: "Французский жим", category: "TRICEPS", equipment: "EZ_BAR", description: "Лёжа или стоя, опускай гриф за голову, разгибая только в локте." },
  { name: "Жим узким хватом", category: "TRICEPS", equipment: "BARBELL", description: "Узкий хват на ширине плеч, опускай штангу к низу груди, локти близко к корпусу." },
  { name: "Разгибание рук на блоке", category: "TRICEPS", equipment: "CABLE", description: "Локти прижаты к корпусу, разгибай руки вниз до конца." },
  { name: "Разгибание гантели из-за головы", category: "TRICEPS", equipment: "DUMBBELL", description: "Гантель за головой, разгибай руку вверх, не разводя локоть в стороны." },
  { name: "Отжимания на брусьях (трицепс)", category: "TRICEPS", equipment: "BODYWEIGHT", description: "Корпус вертикально, локти веди назад, чтобы акцент шёл на трицепс." },
  { name: "Разгибание рук в тренажёре", category: "TRICEPS", equipment: "MACHINE", description: "Локти зафиксированы, разгибай руки вниз до полного выпрямления." },

  { name: "Сгибание запястий со штангой", category: "FOREARMS", equipment: "BARBELL", description: "Предплечья на бедре или скамье, сгибай кисти вверх на полную амплитуду." },
  { name: "Сгибание запястий с гантелями", category: "FOREARMS", equipment: "DUMBBELL", description: "Опирайся предплечьями, сгибай запястья, поднимая гантели." },
  { name: "Разгибание запястий со штангой", category: "FOREARMS", equipment: "BARBELL", description: "Хват сверху, разгибай запястья вверх, работая только кистью." },
  { name: "Вис на перекладине", category: "FOREARMS", equipment: "BODYWEIGHT", description: "Повисни на прямых руках, удерживай хват как можно дольше." },
  { name: "Сгибание запястий на блоке", category: "FOREARMS", equipment: "CABLE", description: "Предплечье на упоре, сгибай кисть на блоке в полную амплитуду." },

  { name: "Скручивания", category: "ABS", equipment: "BODYWEIGHT", description: "Лёжа на спине, отрывай лопатки от пола, сокращая пресс." },
  { name: "Подъём ног в висе", category: "ABS", equipment: "BODYWEIGHT", description: "Вися на перекладине, поднимай прямые или согнутые ноги к груди." },
  { name: "Планка", category: "ABS", equipment: "TIME", description: "Тело прямой линией на предплечьях, держи пресс и ягодицы напряжёнными." },
  { name: "Русский твист", category: "ABS", equipment: "BODYWEIGHT", description: "Сидя с приподнятыми ногами, поворачивай корпус из стороны в сторону." },
  { name: "Скручивания на блоке", category: "ABS", equipment: "CABLE", description: "Стоя на коленях у блока, скручивайся вниз, сокращая пресс." },
  { name: "Скручивания в тренажёре", category: "ABS", equipment: "MACHINE", description: "Зафиксируй корпус, сгибайся вперёд, работая прессом." },
  { name: "Велосипед (пресс)", category: "ABS", equipment: "BODYWEIGHT", description: "Лёжа на спине, поочерёдно тяни колено к противоположному локтю." },

  { name: "Гиперэкстензия", category: "LOWER_BACK", equipment: "BODYWEIGHT", description: "Опускай корпус вперёд с прямой спиной, поднимай до одной линии с ногами." },
  { name: "Становая тяга", category: "LOWER_BACK", equipment: "BARBELL", description: "Спина прямая, тяни штангу вдоль ног, разгибая бёдра и колени одновременно." },
  { name: "Румынская тяга с гантелями", category: "LOWER_BACK", equipment: "DUMBBELL", description: "Отводи таз назад, опускай гантели вдоль ног с прямой спиной." },
  { name: "Наклоны со штангой (гуд монинг)", category: "LOWER_BACK", equipment: "BARBELL", description: "Штанга на плечах, наклоняйся вперёд с прямой спиной, отводя таз назад." },
  { name: "Гиперэкстензия с отягощением", category: "LOWER_BACK", equipment: "DUMBBELL", description: "Как обычная гиперэкстензия, но с гантелью у груди для доп. нагрузки." },

  { name: "Ягодичный мостик со штангой", category: "GLUTES", equipment: "BARBELL", description: "Штанга на бёдрах, толкай таз вверх, сжимая ягодицы в верхней точке." },
  { name: "Ягодичный мостик", category: "GLUTES", equipment: "BODYWEIGHT", description: "Лёжа на спине, стопы на полу, поднимай таз вверх усилием ягодиц." },
  { name: "Тяга бёдрами в тренажёре", category: "GLUTES", equipment: "MACHINE", description: "Спина в упоре, толкай платформу бёдрами, сжимая ягодицы вверху." },
  { name: "Отведение ноги назад в кроссовере", category: "GLUTES", equipment: "CABLE", description: "Стоя лицом к блоку, отводи прямую ногу назад усилием ягодицы." },
  { name: "Выпады с гантелями", category: "GLUTES", equipment: "DUMBBELL", description: "Шагни вперёд, опустись до угла 90° в обоих коленях, оттолкнись назад." },

  { name: "Отведение ноги в тренажёре", category: "HIP_ABDUCTORS", equipment: "MACHINE", description: "Сидя, разводи бёдра в стороны от валиков тренажёра." },
  { name: "Отведение ноги в сторону в кроссовере", category: "HIP_ABDUCTORS", equipment: "CABLE", description: "Стоя боком к блоку, отводи прямую ногу в сторону." },
  { name: "Боковые выпады", category: "HIP_ABDUCTORS", equipment: "BODYWEIGHT", description: "Широкий шаг в сторону, присядь на одну ногу, вторая остаётся прямой." },

  { name: "Приведение ноги в тренажёре", category: "HIP_ADDUCTORS", equipment: "MACHINE", description: "Сидя, своди бёдра к центру, преодолевая сопротивление валиков." },
  { name: "Приведение ноги в кроссовере", category: "HIP_ADDUCTORS", equipment: "CABLE", description: "Стоя боком к блоку, веди прямую ногу к центру перед собой." },
  { name: "Приседания сумо с гантелей", category: "HIP_ADDUCTORS", equipment: "DUMBBELL", description: "Широкая постановка ног, носки в стороны, приседай с гантелью между ног." },

  { name: "Приседания со штангой", category: "QUADS", equipment: "BARBELL", description: "Штанга на спине, приседай до параллели бёдер с полом, колени по линии носков." },
  { name: "Жим ногами в тренажёре", category: "QUADS", equipment: "MACHINE", description: "Сгибай ноги до угла 90°, толкай платформу, не выпрямляя колени полностью." },
  { name: "Приседания в Смите", category: "QUADS", equipment: "SMITH_MACHINE", description: "Гриф на спине, приседай по фиксированной траектории до параллели." },
  { name: "Разгибание ног в тренажёре", category: "QUADS", equipment: "MACHINE", description: "Сидя, разгибай ноги вперёд, работая только квадрицепсом." },
  { name: "Выпады с гантелями (квадрицепс)", category: "QUADS", equipment: "DUMBBELL", description: "Шагни вперёд, опустись до угла 90° в переднем колене, вернись назад." },
  { name: "Приседания с гирей (гоблет)", category: "QUADS", equipment: "KETTLEBELL", description: "Держи гирю у груди, приседай глубоко, локти между колен." },
  { name: "Приседания с собственным весом", category: "QUADS", equipment: "BODYWEIGHT", description: "Приседай до параллели бёдер с полом, руки вперёд для баланса." },
  { name: "Велотренажёр", category: "QUADS", equipment: "CARDIO", description: "Держи ровный темп кручения педалей, задавай нагрузку по самочувствию." },

  { name: "Румынская тяга со штангой", category: "HAMSTRINGS", equipment: "BARBELL", description: "Слегка согнутые колени, опускай штангу вдоль ног с прямой спиной, отводя таз назад." },
  { name: "Сгибание ног в тренажёре", category: "HAMSTRINGS", equipment: "MACHINE", description: "Лёжа или сидя, сгибай ноги, подводя пятки к ягодицам." },
  { name: "Становая тяга на прямых ногах с гантелями", category: "HAMSTRINGS", equipment: "DUMBBELL", description: "Почти прямые ноги, опускай гантели вдоль голеней с прямой спиной." },

  { name: "Подъём на носки стоя в тренажёре", category: "CALVES", equipment: "MACHINE", description: "Поднимайся на носки максимально высоко, задержись вверху на секунду." },
  { name: "Подъём на носки сидя в тренажёре", category: "CALVES", equipment: "MACHINE", description: "Сидя с валиками на коленях, поднимайся на носки в полную амплитуду." },
  { name: "Подъём на носки со штангой", category: "CALVES", equipment: "BARBELL", description: "Штанга на плечах, поднимайся на носки, растягивая икры внизу." },
  { name: "Подъём на носки с гантелями", category: "CALVES", equipment: "DUMBBELL", description: "Гантели в руках, поднимайся на носки, максимально высоко." },
  { name: "Подъём на носки в Смите", category: "CALVES", equipment: "SMITH_MACHINE", description: "Гриф на плечах, поднимайся на носки по фиксированной траектории." },
  { name: "Скакалка", category: "CALVES", equipment: "CARDIO", description: "Прыгай на невысокую высоту, приземляясь мягко на носки." },
  { name: "Бег на дорожке", category: "CALVES", equipment: "CARDIO", description: "Держи ровный темп, приземляйся на переднюю часть стопы для нагрузки на икры." },
];

export const EXERCISES: Exercise[] = raw.map((e, i) => ({
  id: `ex_${i + 1}`,
  ...e,
}));

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
