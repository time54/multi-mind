// cartModule.js - 购物车模块 (被观察者)
const cartModule = (function () {
  let cartItems = [];
  let observers = []; // 存储所有观察者

  // 私有方法：检查商品是否已存在
  function isProductExist(productId) {
    return cartItems.some((item) => item.productId === productId);
  }

  // 计算购物车总价
  function calculateTotal() {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  // 通知所有观察者更新
  function notify() {
    observers.forEach((observer) =>
      observer.update(cartItems, calculateTotal())
    );
  }

  // 公共接口
  return {
    addItem: function (product) {
      if (isProductExist(product.productId)) {
        cartItems = cartItems.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        cartItems.push({ ...product, quantity: 1 });
      }
      notify(); // 通知所有观察者
    },

    removeItem: function (productId) {
      cartItems = cartItems.filter((item) => item.productId !== productId);
      notify(); // 通知所有观察者
    },

    updateQuantity: function (productId, quantity) {
      cartItems = cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      notify(); // 通知所有观察者
    },

    getItems: function () {
      return cartItems;
    },

    getTotal: function () {
      return calculateTotal();
    },

    // 添加观察者
    addObserver: function (observer) {
      observers.push(observer);
    },

    // 移除观察者
    removeObserver: function (observer) {
      observers = observers.filter((obs) => obs !== observer);
    },
  };
})();

// uiModule.js - 购物车UI模块 (观察者)
const uiModule = function () {
  // 更新购物车UI
  function update(cartItems, totalPrice) {
    console.log("购物车更新：");
    console.log("商品列表：");
    cartItems.forEach((item) => {
      console.log(
        `${item.name} - 数量: ${item.quantity}, 价格: ¥${item.price}`
      );
    });
    console.log(`总价: ¥${totalPrice}`);
  }

  return {
    // 注册为购物车的观察者
    subscribe: function (cart) {
      cart.addObserver(this);
    },

    // 响应购物车数据变化
    update: update,
  };
};

// 结算按钮模块 (观察者)
const checkoutModule = function () {
  // 更新结算按钮
  function update(cartItems, totalPrice) {
    console.log(`结算按钮更新，总价：¥${totalPrice}\n`);
  }

  return {
    // 注册为购物车的观察者
    subscribe: function (cart) {
      cart.addObserver(this);
    },

    // 响应购物车数据变化
    update: update,
  };
};

// 使用示例
const cart = cartModule; // 购物车模块
const ui = new uiModule(); // UI模块
const checkout = new checkoutModule(); // 结算按钮模块

// 注册观察者
ui.subscribe(cart);
checkout.subscribe(cart);

// 操作购物车
cart.addItem({ productId: 1, name: "苹果", price: 5.0 });
cart.addItem({ productId: 2, name: "香蕉", price: 3.0 });
cart.addItem({ productId: 1, name: "苹果", price: 5.0 });

cart.removeItem(2); // 删除香蕉
cart.updateQuantity(1, 3); // 修改苹果的数量
