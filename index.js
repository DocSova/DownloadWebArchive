const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function downloadFile(url, filename) {
  const response = await axios.get(url, { responseType: 'stream' });
  const filePath = path.join(__dirname, filename);
  const writer = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    let error = null;
    writer.on('error', (err) => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) {
        resolve();
      }
    });
  });
}

async function scrapeAndDownloadFiles() {
    try {
      // Загружаем страницу
      const response = await axios.get('https://archive.org/download/78rpmCollection1920s1930sPopularMusic');
      const html = response.data;
  
      // Используем cheerio для парсинга HTML
      const $ = cheerio.load(html);
  
      // Находим таблицу с классом "directory-listing-table"
      const table = $('.directory-listing-table');
  
      // Получаем все ссылки внутри таблицы
      const links = table.find('a');
  
      // Рекурсивная функция для загрузки файлов поочередно
      async function downloadNextFile(index) {
        if (index >= links.length) {
          // Все файлы загружены
          return;
        }
  
        const linkElement = links.eq(index);
        let link = linkElement.attr('href');
        const filename = linkElement.text();
  
        // Проверяем, что ссылка указывает на файл, а не на директорию
        if (link && !link.endsWith('/')) {
          try {
            link = 'https://ia803004.us.archive.org/14/items/78rpmCollection1920s1930sPopularMusic/' + link;
            console.log(link);
            await downloadFile(link, filename);
            console.log(`File "${filename}" downloaded.`);
          } catch (error) {
            console.error(`Error downloading file "${filename}":`, error.message);
          }
        }
  
        // Загружаем следующий файл
        await downloadNextFile(index + 1);
      }
  
      // Начинаем загрузку файлов с первого
      await downloadNextFile(0);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  scrapeAndDownloadFiles();