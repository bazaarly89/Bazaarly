import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';

const DEFAULT_HEADING = 'Cookie Policy';
const DEFAULT_BODY = `Dostivox uses cookies and similar technologies to keep you signed in, remember items in your cart, and understand how visitors use our site so we can improve it.

We use essential cookies (required for the site to function, such as keeping you logged in) and analytics cookies (which help us understand traffic patterns). We do not use cookies to sell your personal data to third parties.

Most browsers let you control or delete cookies through their settings. Note that disabling essential cookies may affect features like staying signed in or keeping items in your cart.

By continuing to use Dostivox, you consent to our use of cookies as described in this policy.`;

export default function CookiePolicy() {
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [body, setBody] = useState(DEFAULT_BODY);

  useEffect(() => {
    Api.siteContent()
      .then(({ content }) => {
        if (content?.cookie_heading) setHeading(content.cookie_heading);
        if (content?.cookie_body) setBody(content.cookie_body);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">{heading}</h1>
        <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
          {body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>
    </div>
  );
}
