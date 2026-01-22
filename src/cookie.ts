import { Cookie, CookieJar } from 'tough-cookie';

const cookieJar = new CookieJar();

export const getCookie = async (url: string): Promise<string> => {
  try {
    return await cookieJar.getCookieString(url);
  } catch (e) {
    console.error('[getCookie]', e);
    
    return '';
  }
};

export const setCookie = async (url: string, headers: Headers): Promise<string> => {
  try {
    const cookie = Cookie.parse(headers.get('set-cookie') || '');
    
    if (!cookie) {
      return '';
    }

    const cookieExpires = new Date(cookie.expiryTime() || Date.now() + 60 * 60 * 1000).toUTCString();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    cookie.setMaxAge(null);
    cookie.setExpires(cookieExpires);
    
    const savedCookie = await cookieJar.setCookie(cookie, url, { ignoreError: true });
    
    return savedCookie?.cookieString?.() || '';
  } catch (e) {
    console.error('[setCookie]', e);

    return '';
  }
};
