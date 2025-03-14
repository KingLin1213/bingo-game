const { createApp, ref, computed, reactive, nextTick } = Vue;

createApp({
  setup() {
    // 可用的賓果卡大小
    const availableSizes = ref([3, 5]); // 只包含3和5
    const cardSize = ref(5); // 默認大小為5x5
    
    // 賓果卡數據
    const bingoCard = ref(Array(cardSize.value * cardSize.value).fill(''));
    
    // 已開出的球號
    const drawnNumbers = ref([]);
    
    // 新輸入的球號
    const newDrawnNumber = ref('');
    
    // 新匹配的格子索引
    const newMatches = ref([]);
    
    // 提示訊息
    const showNotification = ref(false);
    const lastMatchedNumber = ref('');
    
    // FREE格是否顯示勾選標記
    const showFreeCheck = ref(true);
    
    // 球號範圍
    const startNumber = ref(1);
    const endNumber = ref(99);
    
    // 更新賓果卡大小
    const updateCardSize = () => {
      const newSize = cardSize.value;
      bingoCard.value = Array(newSize * newSize).fill('');
      resetCard();
    };
    
    // 判斷是否為中央免費格
    const isFreeCell = (index) => {
      const centerIndex = Math.floor(cardSize.value * cardSize.value / 2);
      return index === centerIndex;
    };
    
    // 判斷某格是否已匹配
    const isMatched = (index) => {
      // 免費格始終視為已匹配
      if (isFreeCell(index)) return true;
      
      // 確保有格子值且其值存在於已開出球號中
      const cellValue = bingoCard.value[index];
      if (cellValue === '') return false;
      
      // 精確比較: 將格子值和已開出球號都轉為字符串再比較
      return drawnNumbers.value.some(num => String(num) === String(cellValue));
    };
    
    // 判斷某個球號是否在賓果卡中
    const isNumberInCard = (number) => {
      return bingoCard.value.includes(number.toString());
    };
    
    // 檢查輸入是否有效
    const validateInput = (event, index) => {
      const value = event.target.value;
      
      // 確保輸入為數字且在用戶指定的範圍內
      if (value === '' || (parseInt(value) >= startNumber.value && parseInt(value) <= endNumber.value)) {
        bingoCard.value[index] = value;
      } else {
        // 如果輸入無效，恢復原值或清空
        bingoCard.value[index] = '';
        event.target.value = '';
      }
    };
    
    // 顯示匹配提示
    const showMatchNotification = (number) => {
      lastMatchedNumber.value = number;
      showNotification.value = true;
    };
    
    // 切換格子標記狀態
    const toggleCellMark = (index) => {
      // 如果是FREE格,不做任何處理
      if (isFreeCell(index)) return;
      
      // 如果格子為空,不做任何處理
      if (!bingoCard.value[index]) return;
      
      const number = parseInt(bingoCard.value[index]);
      
      // 如果已經標記,則取消標記
      if (drawnNumbers.value.includes(number)) {
        // 從已開出球號中移除
        const idx = drawnNumbers.value.indexOf(number);
        if (idx > -1) {
          drawnNumbers.value.splice(idx, 1);
        }
      } else {
        // 否則添加標記
        drawnNumbers.value.push(number);
        drawnNumbers.value.sort((a, b) => a - b);
        
        // 添加到新匹配列表,顯示動畫效果
        newMatches.value.push(index);
        
        // 添加視覺反饋
        nextTick(() => {
          const cells = document.querySelectorAll('.bingo-cell');
          if (cells[index]) {
            cells[index].classList.add('highlight-match');
            
            setTimeout(() => {
              cells[index].classList.remove('highlight-match');
            }, 1000);
          }
        });
        
        // 3秒後清除新匹配標記,但保留匹配狀態
        setTimeout(() => {
          const idx = newMatches.value.indexOf(index);
          if (idx > -1) {
            newMatches.value.splice(idx, 1);
          }
        }, 3000);
      }
      
      // 檢查是否連線
      checkBingo();
    };
    
    // 切換已開出球號
    const toggleDrawnNumber = (number) => {
      // 從已開出球號中移除
      const index = drawnNumbers.value.indexOf(number);
      if (index > -1) {
        drawnNumbers.value.splice(index, 1);
      }
    };
    
    // 添加已開出的球號
    const addDrawnNumber = () => {
      const num = parseInt(newDrawnNumber.value);
      if (num && num >= 1 && num <= 99) {
        if (!drawnNumbers.value.includes(num)) {
          // 添加新號碼到開出球號列表
          drawnNumbers.value.push(num);
          drawnNumbers.value.sort((a, b) => a - b);
          newDrawnNumber.value = '';
          
          // 清空之前的新匹配列表
          newMatches.value = [];
          
          // 檢查賓果卡上是否有匹配的數字
          let hasMatch = false;
          bingoCard.value.forEach((cell, index) => {
            if (cell === num.toString() && !isFreeCell(index)) {
              // 將匹配的格子標示為新匹配
              newMatches.value.push(index);
              hasMatch = true;
              
              // 顯示匹配提示
              showMatchNotification(num);
            }
          });

          // 自動檢查是否連線
          checkBingo(); 
          
          // 更新視圖，確保所有匹配項都顯示勾選圖示
          nextTick(() => {
            // 對所有匹配的格子應用動畫效果
            const cells = document.querySelectorAll('.bingo-cell');
            bingoCard.value.forEach((cell, index) => {
              if (isMatched(index) && !isFreeCell(index)) {
                if (cells[index]) {
                  // 對新匹配的格子應用特殊動畫
                  if (newMatches.value.includes(index)) {
                    cells[index].classList.add('highlight-match');
                    setTimeout(() => {
                      cells[index].classList.remove('highlight-match');
                    }, 1000);
                  }
                }
              }
            });
          });
          
          // 3秒後清除新匹配標記，但保留匹配狀態
          setTimeout(() => {
            newMatches.value = [];
          }, 3000);
        } else {
          // 號碼已存在於開出列表中，清空輸入
          newDrawnNumber.value = '';
        }
      }
    };
    
    // 清空已開出的球號
    const clearDrawnNumbers = () => {
      drawnNumbers.value = [];
      newMatches.value = [];
    };
    
    // 重置賓果卡
    const resetCard = () => {
      bingoCard.value = Array(cardSize.value * cardSize.value).fill('');
      newMatches.value = [];
    };
    
    // 隨機生成賓果卡
    const generateRandomCard = () => {
      const numbers = [];
      const usedNumbers = new Set();
      const totalCells = cardSize.value * cardSize.value;
      
      // 生成不重複的隨機數在用戶指定的範圍內
      while (numbers.length < totalCells - 1) {
        const num = Math.floor(Math.random() * (endNumber.value - startNumber.value + 1)) + startNumber.value;
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          numbers.push(num);
        }
      }
      
      // 填充賓果卡，跳過中央FREE格
      for (let i = 0; i < totalCells; i++) {
        if (isFreeCell(i)) {
          bingoCard.value[i] = '';
        } else {
          const numIndex = i > Math.floor(totalCells / 2) ? i - 1 : i;
          bingoCard.value[i] = numbers[numIndex].toString();
        }
      }
      
      // 檢查是否有已開出的球號匹配新生成的賓果卡
      newMatches.value = [];
      bingoCard.value.forEach((cell, index) => {
        if (drawnNumbers.value.includes(parseInt(cell)) && !isFreeCell(index)) {
          newMatches.value.push(index);
        }
      });
      
      // 2秒後清除新匹配標記
      setTimeout(() => {
        newMatches.value = [];
      }, 2000);
      
      checkBingo(); // 檢查是否有連線
    };
    
    // 檢查賓果連線
    const checkBingo = () => {
      const size = cardSize.value;
      let hasLine = false;
      const matched = [];
      
      // 獲取所有已匹配的格子索引
      bingoCard.value.forEach((cell, index) => {
        if (isMatched(index)) {
          matched.push(index);
        }
      });
      
      // 檢查橫向連線
      for (let row = 0; row < size; row++) {
        let rowMatched = true;
        for (let col = 0; col < size; col++) {
          const index = row * size + col;
          if (!matched.includes(index)) {
            rowMatched = false;
            break;
          }
        }
        if (rowMatched) {
          hasLine = true;
          console.log(`橫向連線: 第 ${row + 1} 行`);
        }
      }
      
      // 檢查縱向連線
      for (let col = 0; col < size; col++) {
        let colMatched = true;
        for (let row = 0; row < size; row++) {
          const index = row * size + col;
          if (!matched.includes(index)) {
            colMatched = false;
            break;
          }
        }
        if (colMatched) {
          hasLine = true;
          console.log(`縱向連線: 第 ${col + 1} 列`);
        }
      }
      
      // 檢查左上到右下的對角線
      let diag1Matched = true;
      for (let i = 0; i < size; i++) {
        const index = i * size + i;
        if (!matched.includes(index)) {
          diag1Matched = false;
          break;
        }
      }
      if (diag1Matched) {
        hasLine = true;
        console.log('對角線連線: 左上到右下');
      }
      
      // 檢查右上到左下的對角線
      let diag2Matched = true;
      for (let i = 0; i < size; i++) {
        const index = i * size + (size - 1 - i);
        if (!matched.includes(index)) {
          diag2Matched = false;
          break;
        }
      }
      if (diag2Matched) {
        hasLine = true;
        console.log('對角線連線: 右上到左下');
      }
      
      if (hasLine) {
        console.log('賓果!');
      }
      
      return hasLine;
    };
    
    return {
      availableSizes,
      cardSize,
      bingoCard,
      updateCardSize,
      drawnNumbers,
      newDrawnNumber,
      newMatches,
      showNotification,
      lastMatchedNumber,
      showFreeCheck,
      isFreeCell,
      isMatched,
      isNumberInCard,
      validateInput,
      toggleCellMark,
      toggleDrawnNumber,
      addDrawnNumber,
      clearDrawnNumbers,
      resetCard,
      generateRandomCard,
      checkBingo,
      startNumber,
      endNumber
    };
  }
}).use(ElementPlus).mount('#app'); 