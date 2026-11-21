// ============================================================
//  Google Apps Script — бэкенд для сохранения ответов опроса
//  в Google Таблицу (обновлено: 4 блока, 12 пунктов)
// ============================================================
//
//  КАК НАСТРОИТЬ (пошаговая инструкция):
//
//  1. Открой Google Диск → Создать → Google Таблицы
//     Назови таблицу, например: «Результаты опроса — Веб-дизайн»
//
//  2. В первой строке таблицы впиши заголовки столбцов:
//     A1: Дата/время
//     B1: q1 (возраст)
//     C1: q2 (опыт в нейросетях)
//     D1: q3 (общее впечатление 1-10)
//     E1: q4 (оценка с учётом ИИ 1-10)
//     F1: q5 (удобство сайта 1-10)
//     G1: q6 (вернулись бы на сайт)
//     H1: q7 (визуал 1-10)
//     I1: q8 (баланс цветов)
//     J1: q9 (шрифты и читаемость)
//     K1: q10 (проработка деталей)
//     L1: q11 (заметили бы ИИ)
//     M1: q12 (признаки ИИ)
//
//  3. В меню таблицы: Расширения → Apps Script
//     Удали всё, что там есть, и вставь код ниже.
//
//  4. Нажми «Развернуть» (Deploy) → «Новое развёртывание»
//     → Тип: «Веб-приложение»
//     → Выполнять от: «Меня»
//     → Доступ: «Все» (Anyone)
//     → Нажми «Развернуть»
//
//  5. Скопируй полученный URL (он будет вида:
//     https://script.google.com/macros/s/ABCDE.../exec)
//
//  6. Открой файл survey/index.html, найди строку:
//     const GOOGLE_SCRIPT_URL = '';
//     и вставь туда свой URL:
//     const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/ABCDE.../exec';
//
//  7. Готово! Теперь каждый ответ из опроса будет автоматически
//     записываться в таблицу.
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var row = [
      new Date().toLocaleString('ru-RU'),  // Дата/время
      data.q1  || '',   // 1. Возраст
      data.q2  || '',   // 2. Опыт в нейросетях
      data.q3  || '',   // 3. Общее впечатление (1-10)
      data.q4  || '',   // 4. Оценка с учётом ИИ (1-10)
      data.q5  || '',   // 5. Удобство сайта (1-10)
      data.q6  || '',   // 6. Хотели бы вернуться на сайт
      data.q7  || '',   // 7. Визуал (1-10)
      data.q8  || '',   // 8. Баланс цветов
      data.q9  || '',   // 9. Шрифты и читаемость
      data.q10 || '',   // 10. Проработка деталей
      data.q11 || '',   // 11. Заметили бы ИИ
      data.q12 || ''    // 12. Признаки ИИ
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Тестовая функция — можно запустить вручную для проверки
function doGet(e) {
  return ContentService
    .createTextOutput('Бэкенд опроса работает! Используйте POST для отправки данных.')
    .setMimeType(ContentService.MimeType.TEXT);
}
