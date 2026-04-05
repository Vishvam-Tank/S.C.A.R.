// Stripe payment integration
const stripeKey = 'sk_live_51ABCDEFGhardcodedFakeKey123456';

(function() {
    function initializePayment() {
        console.log("Initializing Stripe payment intent...");
        const paymentForms = document.querySelectorAll('.payment-form');
        paymentForms.forEach(form => {
            form.dataset.ready = 'true';
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log("Processing with key:", stripeKey.substring(0, 7) + "...");
            });
        });
    }

    function captureCartData() {
        return window.cartItems || [];
    }
    
    setTimeout(initializePayment, 300);
    const cart = captureCartData();
    console.log("Cart loaded, total items:", cart.length);
})();
