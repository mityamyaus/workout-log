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

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: Equipment;
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

const raw: { name: string; category: MuscleGroup; equipment: Equipment }[] = [
  { name: "Шраги со штангой", category: "TRAPS", equipment: "BARBELL" },
  { name: "Шраги с гантелями", category: "TRAPS", equipment: "DUMBBELL" },
  { name: "Шраги в тренажёре", category: "TRAPS", equipment: "MACHINE" },
  { name: "Тяга штанги к подбородку", category: "TRAPS", equipment: "BARBELL" },
  { name: "Шраги в Смите", category: "TRAPS", equipment: "SMITH_MACHINE" },

  { name: "Жим штанги стоя", category: "FRONT_DELTS", equipment: "BARBELL" },
  { name: "Жим гантелей сидя", category: "FRONT_DELTS", equipment: "DUMBBELL" },
  { name: "Подъём штанги перед собой", category: "FRONT_DELTS", equipment: "BARBELL" },
  { name: "Подъём гантелей перед собой", category: "FRONT_DELTS", equipment: "DUMBBELL" },
  { name: "Жим в Смите сидя", category: "FRONT_DELTS", equipment: "SMITH_MACHINE" },

  { name: "Махи гантелями в стороны стоя", category: "SIDE_DELTS", equipment: "DUMBBELL" },
  { name: "Махи в стороны в кроссовере", category: "SIDE_DELTS", equipment: "CABLE" },
  { name: "Разведение рук в тренажёре (дельты)", category: "SIDE_DELTS", equipment: "MACHINE" },

  { name: "Махи гантелями в наклоне", category: "REAR_DELTS", equipment: "DUMBBELL" },
  { name: "Разведение в тренажёре (задние дельты)", category: "REAR_DELTS", equipment: "MACHINE" },
  { name: "Тяга к лицу на канате", category: "REAR_DELTS", equipment: "CABLE" },

  { name: "Жим штанги лёжа", category: "CHEST", equipment: "BARBELL" },
  { name: "Жим гантелей лёжа", category: "CHEST", equipment: "DUMBBELL" },
  { name: "Жим штанги на наклонной скамье", category: "CHEST", equipment: "BARBELL" },
  { name: "Жим гантелей на наклонной скамье", category: "CHEST", equipment: "DUMBBELL" },
  { name: "Разведение гантелей лёжа", category: "CHEST", equipment: "DUMBBELL" },
  { name: "Сведение рук в кроссовере", category: "CHEST", equipment: "CABLE" },
  { name: "Жим в Смите лёжа", category: "CHEST", equipment: "SMITH_MACHINE" },
  { name: "Жим в тренажёре (грудь)", category: "CHEST", equipment: "MACHINE" },
  { name: "Отжимания от пола", category: "CHEST", equipment: "BODYWEIGHT" },
  { name: "Отжимания на брусьях", category: "CHEST", equipment: "BODYWEIGHT" },

  { name: "Подтягивания широким хватом", category: "UPPER_BACK", equipment: "BODYWEIGHT" },
  { name: "Тяга штанги в наклоне", category: "UPPER_BACK", equipment: "BARBELL" },
  { name: "Тяга гантели в наклоне", category: "UPPER_BACK", equipment: "DUMBBELL" },
  { name: "Тяга верхнего блока", category: "UPPER_BACK", equipment: "CABLE" },
  { name: "Тяга горизонтального блока", category: "UPPER_BACK", equipment: "CABLE" },
  { name: "Тяга в тренажёре (спина)", category: "UPPER_BACK", equipment: "MACHINE" },
  { name: "Подтягивания с поддержкой", category: "UPPER_BACK", equipment: "ASSISTED_BODYWEIGHT" },

  { name: "Подъём штанги на бицепс", category: "BICEPS", equipment: "BARBELL" },
  { name: "Подъём гантелей на бицепс", category: "BICEPS", equipment: "DUMBBELL" },
  { name: "Подъём EZ-штанги на бицепс", category: "BICEPS", equipment: "EZ_BAR" },
  { name: "Молотковые сгибания", category: "BICEPS", equipment: "DUMBBELL" },
  { name: "Сгибание рук на блоке", category: "BICEPS", equipment: "CABLE" },
  { name: "Сгибание рук в тренажёре", category: "BICEPS", equipment: "MACHINE" },

  { name: "Французский жим", category: "TRICEPS", equipment: "EZ_BAR" },
  { name: "Жим узким хватом", category: "TRICEPS", equipment: "BARBELL" },
  { name: "Разгибание рук на блоке", category: "TRICEPS", equipment: "CABLE" },
  { name: "Разгибание гантели из-за головы", category: "TRICEPS", equipment: "DUMBBELL" },
  { name: "Отжимания на брусьях (трицепс)", category: "TRICEPS", equipment: "BODYWEIGHT" },
  { name: "Разгибание рук в тренажёре", category: "TRICEPS", equipment: "MACHINE" },

  { name: "Сгибание запястий со штангой", category: "FOREARMS", equipment: "BARBELL" },
  { name: "Сгибание запястий с гантелями", category: "FOREARMS", equipment: "DUMBBELL" },
  { name: "Разгибание запястий со штангой", category: "FOREARMS", equipment: "BARBELL" },
  { name: "Вис на перекладине", category: "FOREARMS", equipment: "BODYWEIGHT" },
  { name: "Сгибание запястий на блоке", category: "FOREARMS", equipment: "CABLE" },

  { name: "Скручивания", category: "ABS", equipment: "BODYWEIGHT" },
  { name: "Подъём ног в висе", category: "ABS", equipment: "BODYWEIGHT" },
  { name: "Планка", category: "ABS", equipment: "TIME" },
  { name: "Русский твист", category: "ABS", equipment: "BODYWEIGHT" },
  { name: "Скручивания на блоке", category: "ABS", equipment: "CABLE" },
  { name: "Скручивания в тренажёре", category: "ABS", equipment: "MACHINE" },
  { name: "Велосипед (пресс)", category: "ABS", equipment: "BODYWEIGHT" },

  { name: "Гиперэкстензия", category: "LOWER_BACK", equipment: "BODYWEIGHT" },
  { name: "Становая тяга", category: "LOWER_BACK", equipment: "BARBELL" },
  { name: "Румынская тяга с гантелями", category: "LOWER_BACK", equipment: "DUMBBELL" },
  { name: "Наклоны со штангой (гуд монинг)", category: "LOWER_BACK", equipment: "BARBELL" },
  { name: "Гиперэкстензия с отягощением", category: "LOWER_BACK", equipment: "DUMBBELL" },

  { name: "Ягодичный мостик со штангой", category: "GLUTES", equipment: "BARBELL" },
  { name: "Ягодичный мостик", category: "GLUTES", equipment: "BODYWEIGHT" },
  { name: "Тяга бёдрами в тренажёре", category: "GLUTES", equipment: "MACHINE" },
  { name: "Отведение ноги назад в кроссовере", category: "GLUTES", equipment: "CABLE" },
  { name: "Выпады с гантелями", category: "GLUTES", equipment: "DUMBBELL" },

  { name: "Отведение ноги в тренажёре", category: "HIP_ABDUCTORS", equipment: "MACHINE" },
  { name: "Отведение ноги в сторону в кроссовере", category: "HIP_ABDUCTORS", equipment: "CABLE" },
  { name: "Боковые выпады", category: "HIP_ABDUCTORS", equipment: "BODYWEIGHT" },

  { name: "Приведение ноги в тренажёре", category: "HIP_ADDUCTORS", equipment: "MACHINE" },
  { name: "Приведение ноги в кроссовере", category: "HIP_ADDUCTORS", equipment: "CABLE" },
  { name: "Приседания сумо с гантелей", category: "HIP_ADDUCTORS", equipment: "DUMBBELL" },

  { name: "Приседания со штангой", category: "QUADS", equipment: "BARBELL" },
  { name: "Жим ногами в тренажёре", category: "QUADS", equipment: "MACHINE" },
  { name: "Приседания в Смите", category: "QUADS", equipment: "SMITH_MACHINE" },
  { name: "Разгибание ног в тренажёре", category: "QUADS", equipment: "MACHINE" },
  { name: "Выпады с гантелями (квадрицепс)", category: "QUADS", equipment: "DUMBBELL" },
  { name: "Приседания с гирей (гоблет)", category: "QUADS", equipment: "KETTLEBELL" },
  { name: "Приседания с собственным весом", category: "QUADS", equipment: "BODYWEIGHT" },
  { name: "Велотренажёр", category: "QUADS", equipment: "CARDIO" },

  { name: "Румынская тяга со штангой", category: "HAMSTRINGS", equipment: "BARBELL" },
  { name: "Сгибание ног в тренажёре", category: "HAMSTRINGS", equipment: "MACHINE" },
  { name: "Становая тяга на прямых ногах с гантелями", category: "HAMSTRINGS", equipment: "DUMBBELL" },

  { name: "Подъём на носки стоя в тренажёре", category: "CALVES", equipment: "MACHINE" },
  { name: "Подъём на носки сидя в тренажёре", category: "CALVES", equipment: "MACHINE" },
  { name: "Подъём на носки со штангой", category: "CALVES", equipment: "BARBELL" },
  { name: "Подъём на носки с гантелями", category: "CALVES", equipment: "DUMBBELL" },
  { name: "Подъём на носки в Смите", category: "CALVES", equipment: "SMITH_MACHINE" },
  { name: "Скакалка", category: "CALVES", equipment: "CARDIO" },
  { name: "Бег на дорожке", category: "CALVES", equipment: "CARDIO" },
];

export const EXERCISES: Exercise[] = raw.map((e, i) => ({
  id: `ex_${i + 1}`,
  ...e,
}));

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
