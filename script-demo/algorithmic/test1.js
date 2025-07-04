const arr = ["ab", "c", "d", "ab", "c"];

function test(strSting) {
  const countMap = new Map();
  return strSting.map((str) => {
    const count = (countMap.get(str) || 0) + 1;
    countMap.set(str, count);
    return `${str}${count}`;
  });
}

console.log(test(arr));
