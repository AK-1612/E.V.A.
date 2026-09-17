/**
 * Application Deeplink & External App Dispatcher
 */

export function openWhatsAppChat(phone: string, text: string): void {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedText = encodeURIComponent(text);

  // Detect mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // Attempt direct native app scheme first
    const nativeUri = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    window.location.href = nativeUri;

    // Fallback timer if protocol handler isn't registered
    setTimeout(() => {
      window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    }, 1200);
  } else {
    // Desktop: Web WhatsApp or native
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  }
}

export function openSpotifyApp(searchQuery?: string): void {
  const query = searchQuery?.trim();
  const uri = query ? `spotify:search:${encodeURIComponent(query)}` : 'spotify://';

  // Navigate to native spotify URL scheme
  window.location.href = uri;

  // Fallback to web player if desktop/uninstalled after brief delay
  const start = Date.now();
  setTimeout(() => {
    if (Date.now() - start < 1800) {
      const webUrl = query
        ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
        : 'https://open.spotify.com';
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1200);
}
