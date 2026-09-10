import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';

const DEFAULT_HEADING = 'Affiliate Disclosure';
const DEFAULT_BODY = `Dostivox participates in affiliate programs with various merchants, including Amazon and Flipkart. This means that when you click on certain product links on our site and make a purchase, we may earn a small commission — at no extra cost to you.

We only recommend products we genuinely believe are useful based on the information available to us. Affiliate relationships never influence which products we choose to feature or how we describe them.

Prices, availability and offers shown on Dostivox are pulled from merchant listings and can change at any time — always confirm the final price on the merchant's site before completing your purchase.

If you have any questions about our affiliate relationships, feel free to contact us.`;

export default function AffiliateDisclosure() {
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [body, setBody] = useState(DEFAULT_BODY);

  useEffect(() => {
    Api.siteContent()
      .then(({ content }) => {
        if (content?.affiliate_disclosure_heading) setHeading(content.affiliate_disclosure_heading);
        if (content?.affiliate_disclosure_body) setBody(content.affiliate_disclosure_body);
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
