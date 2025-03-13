const { createApp, ref, computed, reactive } = Vue;

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
      if (isFreeCell(index)) return true;
      return drawnNumbers.value.includes(bingoCard.value[index]) && bingoCard.value[index] !== '';
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
        
        // 2秒後清除新匹配標記
        setTimeout(() => {
          const idx = newMatches.value.indexOf(index);
          if (idx > -1) {
            newMatches.value.splice(idx, 1);
          }
        }, 2000);
      }
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
          drawnNumbers.value.push(num);
          drawnNumbers.value.sort((a, b) => a - b);
          newDrawnNumber.value = '';
          
          // 檢查賓果卡上是否有匹配的數字
          bingoCard.value.forEach((cell, index) => {
            if (cell === num.toString() && !isFreeCell(index)) {
              // 將匹配的格子標示為已匹配
              newMatches.value.push(index);
              
              // 顯示匹配提示
              showMatchNotification(num);
            }
          });
          
          checkBingo(); // 自動檢查是否連線
        } else {
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
      // 檢查橫向、縱向和對角線連線的邏輯
      // ...
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