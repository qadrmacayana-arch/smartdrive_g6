// Static FAQ entries for the user-facing page.
    const FAQ_ENTRIES = [
      { q: 'How do I book a vehicle?', a: 'To book, go to Rent a Vehicle, choose a car and dates, then follow the checkout steps to confirm your booking.' },
      { q: 'What payment methods can I use?', a: 'We accept major credit cards, GCash, and bank transfers. Payment options are shown at checkout.' },
      { q: 'Can I cancel my booking?', a: 'Cancellations are accepted up to 24 hours before pickup; fees may apply depending on the booking terms.' },
      { q: 'How do I view my booking history?', a: 'Visit Dashboard → My Bookings to see past and upcoming reservations.' },
      { q: 'How do I contact support?', a: 'Use the Contact Us link in the footer or reply through the AI Assistant for guidance on contacting support.' }
    ];

    function renderFAQ() {
      const container = document.getElementById('faq-list');
      container.innerHTML = FAQ_ENTRIES.map(f => `
        <div class="faq-item">
          <div style="font-weight:600">${escapeHtml(f.q)}</div>
          <div style="margin-top:8px;color:#374151">${escapeHtml(f.a)}</div>
        </div>
      `).join('');
    }

    // Conversational assistant state is intentionally local to this page.
    let conversationContext = '';
    const assistantBody = document.getElementById('assistant-body');
    const assistantInput = document.getElementById('assistant-input');
    document.getElementById('assistant-send').addEventListener('click', sendQuestion);
    assistantInput.addEventListener('keypress', (e)=> { if (e.key === 'Enter') sendQuestion(); });
    document.getElementById('clear-convo').addEventListener('click', ()=> {
      assistantBody.innerHTML = '';
      conversationContext = '';
      appendMessage('Assistant', 'Conversation cleared. What can I help you with today?');
    });

    function appendMessage(who, text) {
      const el = document.createElement('div');
      el.style.marginBottom = '10px';
      el.innerHTML = `<div style="font-size:12px;color:#6b7280;margin-bottom:4px">${who}</div><div style="background:${who==='You'? '#f3f4f6':'#eef2ff'};padding:10px;border-radius:8px">${escapeHtml(text)}</div>`;
      assistantBody.appendChild(el);
      assistantBody.scrollTop = assistantBody.scrollHeight;
    }

    function sendQuestion() {
      const q = assistantInput.value.trim();
      if (!q) return;
      appendMessage('You', q);
      assistantInput.value = '';
      appendMessage('Assistant', 'Thinking...');
      setTimeout(()=>{
        // replace last 'Thinking...'
        assistantBody.lastChild.remove();
        appendMessage('Assistant', aiRespond(q));
      }, 350);
    }

    function aiRespond(query) {
      const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      const words = q.split(/\s+/).filter(Boolean);
      const has = (...terms) => terms.some(term => q.includes(term));
      const startsWith = (...terms) => terms.some(term => words[0] === term);

      if (has('hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening')) {
        conversationContext = 'general';
        return 'Hello! I can help with vehicles, bookings, payments, cancellations, pickup details, or general questions about SmartDrive. What would you like to know?';
      }
      if (has('thank', 'thanks')) return 'You are welcome. Is there anything else you would like to ask?';
      if (has('bye', 'goodbye', 'see you')) return 'Goodbye! I hope you have a smooth trip.';
      if (startsWith('yes', 'no') && conversationContext === 'support') {
        return q.startsWith('yes')
          ? 'Great. Please describe the issue and include your booking details if they are relevant.'
          : 'No problem. I can still help with a different booking or vehicle question.';
      }

      if (has('book', 'reserve', 'reservation')) {
        conversationContext = 'booking';
        return 'To book a vehicle, open Rent a Vehicle, choose your vehicle and dates, then complete the checkout steps. Do you already know your pickup and return dates?';
      }
      if (has('available', 'availability', 'car', 'vehicle', 'fleet')) {
        conversationContext = 'vehicle';
        return 'You can browse the available vehicles on the Rent a Vehicle page. Vehicle availability and pricing depend on your selected dates. Would you like help choosing a vehicle type?';
      }
      if (has('price', 'cost', 'fee', 'rate', 'expensive', 'cheap')) {
        conversationContext = 'pricing';
        return 'Prices vary by vehicle and rental duration. Select a vehicle and dates on the rental page to see the current price. Are you asking about the rental price, a deposit, or a cancellation fee?';
      }
      if (has('pay', 'payment', 'gcash', 'card', 'transfer')) {
        conversationContext = 'payment';
        return 'We accept major credit cards, GCash, and bank transfers. The available payment options are shown during checkout. Are you having trouble with a particular payment method?';
      }
      if (has('cancel', 'cancellation', 'refund', 'return money')) {
        conversationContext = 'cancellation';
        return 'Cancellations are accepted up to 24 hours before pickup, although fees may apply. You can request cancellation from My Bookings or contact support. Is this about an upcoming booking?';
      }
      if (has('history', 'my booking', 'upcoming booking', 'past booking', 'reservation status')) {
        conversationContext = 'booking';
        return 'Open Dashboard and choose My Bookings to view your past and upcoming reservations. Would you like help finding a specific booking?';
      }
      if (has('pickup', 'pick up', 'drop off', 'return', 'location', 'where')) {
        conversationContext = 'trip';
        return 'Pickup and return details are shown with your booking information. Which part do you need help with: pickup location, pickup time, return location, or return time?';
      }
      if (has('support', 'contact', 'help', 'problem', 'issue', 'error')) {
        conversationContext = 'support';
        return 'I can help you work through the issue. You can also use the Contact Us link in the footer for direct support. What happened?';
      }
      if (has('policy', 'insurance', 'license', 'requirement', 'requirements', 'document')) {
        conversationContext = 'policy';
        return 'Requirements and policies can vary by booking. Please check the booking details and contact support when you need a definitive answer. Which policy or document are you asking about?';
      }
      if (conversationContext === 'booking') return 'I can help with that booking. Do you need help choosing dates, selecting a vehicle, completing payment, or checking your reservation?';
      if (conversationContext === 'vehicle') return 'Tell me what you need from the vehicle, such as seating, price range, or availability, and I will point you in the right direction.';
      if (conversationContext === 'support') return 'I am here to help. Could you share a little more about what you are trying to do or what went wrong?';
      return 'I can chat about SmartDrive rentals, vehicles, bookings, payments, pickup, returns, policies, and support. Tell me what you are trying to do, and I will help you figure out the next step.';
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
    }

    // Initialize
    renderFAQ();
    appendMessage('Assistant', 'Hi! I am the SmartDrive assistant. Ask me anything about your rental, or just start a conversation.');