Title: 宫区块数对 - 数独解法

URL Source: https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-shu-dui/

Markdown Content:
# 宫区块数对 - 数独解法

[经典](https://sudoku.com/zh)[杀手](https://sudoku.com/zh/killer)[0 7 天 0 2 时 夏日心情](https://sudoku.com/zh/postcards)[0 3 时 0 8 分 即将 锦标赛](https://sudoku.com/zh/tournaments)[6月1日 每日挑战](https://sudoku.com/zh/challenges)[奖品](https://sudoku.com/zh/awards)[规则](https://sudoku.com/zh/shu-du-gui-ze/)[可打印的数独](https://sudoku.com/zh/sudoku-printable)[求解器](https://sudoku.com/zh/sudoku-solver)[建议](https://sudoku.com/zh/youxi-guize/)[设置](https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-shu-dui/#)

中文

*   [English](https://sudoku.com/sudoku-rules/pointing-pairs/ "English")
*   [日本語](https://sudoku.com/jp/nanpurenoruru/pointingupea/ "日本語")
*   [Italiano](https://sudoku.com/it/regole-del-sudoku/coppie-per-esclusione/ "Italiano")
*   [中文](https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-shu-dui/ "中文")
*   [Deutsch](https://sudoku.com/de/sudoku-regeln/zwei-hinweisende-zahlenoptionen/ "Deutsch")
*   [Français](https://sudoku.com/fr/regles-du-sudoku/paires-pointantes/ "Français")
*   [Español](https://sudoku.com/es/reglas-del-sudoku/parejas-apuntadoras/ "Español")
*   [Português](https://sudoku.com/pt/regras-do-sudoku/pares-a-apontar/ "Português")
*   [Türk](https://sudoku.com/tr/sudoku-kurallari/acik-ikililer/ "Türk")
*   [Polski](https://sudoku.com/pl/zasady-sudoku/wskazujace-pary/ "Polski")
*   [한국어](https://sudoku.com/ko/seudoku-gyuchig/peeo-jegeo/ "한국어")
*   [ไทย](https://sudoku.com/th/k-tkas-dok/tw-lekh-khch-thang/ "ไทย")
*   [Tiếng Việt](https://sudoku.com/vi/luat-choi-sudoku/cap-loai-tru/ "Tiếng Việt")
*   [عربى](https://sudoku.com/ar/qwad-swdwkw/azwaj-alarqam-almwjht/ "عربى")
*   [Español (México)](https://sudoku.com/mx/reglas-del-sudoku/pares-que-apuntan/ "Español (México)")
*   [Português (Brasil)](https://sudoku.com/br/regras-do-sudoku/pares-apontadores/ "Português (Brasil)")
*   [中文（T）](https://sudoku.com/tw/shu-du-gui-ze/shuang-ge-qu-kuai-pai-chu/ "中文（T）")
*   [Русский](https://sudoku.com/ru/pravila-sudoku/ukazuusie-pary/ "Русский")

[](https://sudoku.com/zh "Play Free Sudoku, a Popular Online Puzzle Game")

[经典](https://sudoku.com/zh)[杀手](https://sudoku.com/zh/killer)

[0 7 天 0 2 时 夏日心情](https://sudoku.com/zh/postcards)[0 3 时 0 8 分 即将 锦标赛](https://sudoku.com/zh/tournaments)[6月1日 每日挑战](https://sudoku.com/zh/challenges)[奖品](https://sudoku.com/zh/awards)[规则](https://sudoku.com/zh/shu-du-gui-ze/)[设置](https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-shu-dui/#)

新游戏

 选择游戏模式 

 当前游戏进度将丢失 

 经典 

 杀手 

夏日心情

[简单](https://sudoku.com/zh/rongyi/)[中等](https://sudoku.com/zh/zhongdeng/)[困难](https://sudoku.com/zh/kunnan/)[专家](https://sudoku.com/zh/zhuanjia/)[大师](https://sudoku.com/zh/evil/)[极限](https://sudoku.com/zh/extreme/)

 重新开始 

[简单](https://sudoku.com/zh/killer/rongyi/)[中等](https://sudoku.com/zh/killer/zhongdeng/)[困难](https://sudoku.com/zh/killer/kunnan/)[专家](https://sudoku.com/zh/killer/zhuanjia/)

 重新开始 

 继续 

 重新开始 

[简单 0/3](https://sudoku.com/zh/postcards/event-sudoku)[中等 0/2](https://sudoku.com/zh/postcards/event-sudoku)[困难 0/3](https://sudoku.com/zh/postcards/event-sudoku)[专家 0/1](https://sudoku.com/zh/postcards/event-sudoku)[大师](https://sudoku.com/zh/postcards/event-sudoku)[极限](https://sudoku.com/zh/postcards/event-sudoku)

 重新开始 

 重新开始 

# “宫区块数对”解法。

[Video 2](https://www.youtube.com/watch?v=Ldz_1kFRFto)

当一条笔记在一个宫中出现两次并且该笔记属于同一行或列时，“宫区块数对”适用。这说明该笔记必然是这个宫中这两个单元格之一的解。因此，您可以将该笔记从这一行或列的任何其他单元格中删除。

为了更好地理解“宫区块数对”，我们来看一个例子。

我们来看看左上角的这个宫。所有可能包含数字 4 的单元格都在一列中。由于数字 4 应该出现在这个宫中至少一次，那么这里其中一个突出显示的单元格必然包含 4。

![Image 3](../../assets/sudokucom-zh-pointing-pairs/01-1646982891-11.-20Pointing-20pairs_1.png)![Image 4](../../assets/sudokucom-zh-pointing-pairs/02-1646982899-11.-20Pointing-20pairs_2.png)

由此，我们可以安全排除这一列的所有单元格包含 4 的可能。

记住您可以对宫、行和列使用相同的技巧。

这就是“宫区块数对”解法。现在，您可以继续学习下面的数独策略“宫区块三数组”。

### Post navigation

[隐性三数组](https://sudoku.com/zh/shu-du-gui-ze/yin-xing-san-shu-zu/)

[宫区块三数组](https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-san-shu-zu/)

![Image 5: sudoku app icon](../../assets/sudokucom-zh-pointing-pairs/03-icon-app.png)

Sudoku.com - 数字游戏

Easybrain

[](https://app.adjust.com/4j48k9v "下载应用，请到 Google Play")[](https://app.adjust.com/ver8rks "App Store 下载")

[©2018-2026 Easybrain. All Rights Reserved.](https://www.easybrain.com/)

[首页](https://sudoku.com/zh)

[经典](https://sudoku.com/zh)

[杀手](https://sudoku.com/zh/killer)

[每日挑战](https://sudoku.com/zh/challenges)

[锦标赛](https://sudoku.com/zh/tournaments)

[奖品](https://sudoku.com/zh/awards)

[规则](https://sudoku.com/zh/shu-du-gui-ze/)

[建议](https://sudoku.com/zh/youxi-guize/)

[取得联系](https://sudoku.com/zh/get-in-touch "Get in Touch")

[可打印的数独](https://sudoku.com/zh/sudoku-printable)

[求解器](https://sudoku.com/zh/sudoku-solver)

中文

*   [English](https://sudoku.com/sudoku-rules/pointing-pairs/ "English")
*   [日本語](https://sudoku.com/jp/nanpurenoruru/pointingupea/ "日本語")
*   [Italiano](https://sudoku.com/it/regole-del-sudoku/coppie-per-esclusione/ "Italiano")
*   [中文](https://sudoku.com/zh/shu-du-gui-ze/gong-qu-kuai-shu-dui/ "中文")
*   [Deutsch](https://sudoku.com/de/sudoku-regeln/zwei-hinweisende-zahlenoptionen/ "Deutsch")
*   [Français](https://sudoku.com/fr/regles-du-sudoku/paires-pointantes/ "Français")
*   [Español](https://sudoku.com/es/reglas-del-sudoku/parejas-apuntadoras/ "Español")
*   [Português](https://sudoku.com/pt/regras-do-sudoku/pares-a-apontar/ "Português")
*   [Türk](https://sudoku.com/tr/sudoku-kurallari/acik-ikililer/ "Türk")
*   [Polski](https://sudoku.com/pl/zasady-sudoku/wskazujace-pary/ "Polski")
*   [한국어](https://sudoku.com/ko/seudoku-gyuchig/peeo-jegeo/ "한국어")
*   [ไทย](https://sudoku.com/th/k-tkas-dok/tw-lekh-khch-thang/ "ไทย")
*   [Tiếng Việt](https://sudoku.com/vi/luat-choi-sudoku/cap-loai-tru/ "Tiếng Việt")
*   [عربى](https://sudoku.com/ar/qwad-swdwkw/azwaj-alarqam-almwjht/ "عربى")
*   [Español (México)](https://sudoku.com/mx/reglas-del-sudoku/pares-que-apuntan/ "Español (México)")
*   [Português (Brasil)](https://sudoku.com/br/regras-do-sudoku/pares-apontadores/ "Português (Brasil)")
*   [中文（T）](https://sudoku.com/tw/shu-du-gui-ze/shuang-ge-qu-kuai-pai-chu/ "中文（T）")
*   [Русский](https://sudoku.com/ru/pravila-sudoku/ukazuusie-pary/ "Русский")

[Terms](https://easybrain.com/terms "Terms")[Cookie Policy (Do Not Sell or Share My Personal Information)](https://sudoku.com/page/cookies-ca/ "Cookie Policy (Do Not Sell or Share My Personal Information)")[Privacy](https://easybrain.com/privacy "Privacy")

We and our partners store and/or access information (including personal data such as device identifiers in cookies) on your device to provide, measure, analyze, improve our services and personalize ads and content. To manage your cookie preferences ('Do Not Sell or Share My Personal Information'), click here. For more information or to change your preferences at any time go to the [Cookie Policy](https://sudoku.com/page/cookies-ca/ "Cookie Policy").

Cookie preferences

*   About Cookies
*   Strictly Necessary Cookies
*   Analytics Cookies
*   Advertising and Measurement Cookies
*   More Information

About Cookies

Cookies are small pieces of text sent to your web browser that assist us in providing our Services according to the purposes described. A cookie file is stored in your web browser and allows our Services or a third-party to recognize you and make your next visit easier and the Service more useful to you. Some of the purposes for which Cookies are installed may also require the User's consent.

Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.

Strictly Necessary Cookies

Strictly necessary cookies are set to recognise you when you return to our Website, set up your consent settings, and embed functionality from third party services. Also, these cookies enable us to personalise our content for you and remember your last game progress. These cookies are necessary for the functionality of the Website. You may set your browser to block these cookies, but the Website will not function properly without them.

Cookies Used

*   Session Cookies
*   Consent Cookies
*   YouTube Cookies
*   Google reCaptcha
*   Cloudflare Load Balancer

Analytics Cookies

- [x]  

We may use analytics cookies to track information on how the Website is used so that we can make improvements. We may also use analytics cookies to test new advertisements, pages, features or new functionality of the Website to see how our users react to them.

Cookies Used

*   Google Analytics
*   [https://policies.google.com/privacy?hl=en](https://policies.google.com/privacy?hl=en)

Advertising and Measurement Cookies

- [x]  

These types of cookies and other storage technologies such as Pixel Tags are used to deliver advertisements on and through the Service and track the performance of these advertisements. To this end, we may share information about your use of our site with our trusted social media and advertising partners. These cookies may also be used to enable third-parties, including social media and advertising networks to provide measurement services and deliver ads that may be relevant to you based upon your activities or interests.

Cookies Used

*   AdSense by Google and their partners
*   [http://www.google.com/policies/privacy/](http://www.google.com/policies/privacy/)
*   [https://support.google.com/adsense/answer/9012903?hl=en-GB&ref_topic=7670012](https://support.google.com/adsense/answer/9012903?hl=en-GB&ref_topic=7670012)

*   Ad Manager by Google Ireland Limited
*   [https://policies.google.com/privacy](https://policies.google.com/privacy)

*   Meta Pixel by Meta Ireland Platform Limited an Meta Platforms Inc.
*   [https://www.facebook.com/policies/cookies](https://www.facebook.com/policies/cookies)

*   Index Exchange by Index Exchange Inc.
*   [https://www.indexexchange.com/privacy](https://www.indexexchange.com/privacy/)

*   OpenX by OpenX Software Ltd (US)
*   [https://www.openx.com/legal/privacy-policy/](https://www.openx.com/legal/privacy-policy/)

*   PubMatic by PubMatic, Inc. (US)
*   [https://pubmatic.com/legal/privacy-policy/](https://pubmatic.com/legal/privacy-policy/)

*   Rise Engage byTypeA Holdings Ltd.
*   [https://risecodes.com/video-advertisement-player-privacy-policy/](https://risecodes.com/video-advertisement-player-privacy-policy/)

*   Rubicon Project by Magnite Inc. (US)
*   [https://www.magnite.com/legal/advertising-technology-privacy-policy/](https://www.magnite.com/legal/advertising-technology-privacy-policy/)

*   Yieldmo by Yieldmo, Inc.
*   [https://www.yieldmo.com/privacy-policy/](https://www.yieldmo.com/privacy-policy/)

*   Amazon by Amazon.com, Inc.
*   [https://aws.amazon.com/privacy/](https://aws.amazon.com/privacy/)

*   TripleLift by Triple Lift, Inc.
*   [https://triplelift.com/privacy/](https://triplelift.com/privacy/)

*   Smaato by Smaato, Inc. (US)
*   [https://www.smaato.com/privacy/](https://www.smaato.com/privacy/)

*   LoopMe LoopMe Limited (UK).
*   [https://legal.loopme.com/privacy-center#contract-hyartvn1o](https://legal.loopme.com/privacy-center#contract-hyartvn1o)

*   Xandr by Xandr,Inc. (USA)
*   [https://about.ads.microsoft.com/en-us/solutions/xandr/platform-privacy-policy](https://about.ads.microsoft.com/en-us/solutions/xandr/platform-privacy-policy)

*   TAPPX by TAPPCELERATOR MEDIA, S.L (Spain)
*   [https://www.tappx.com/legal/privacy-policy](https://www.tappx.com/legal/privacy-policy)

*   Minute Media by Pro Sportority Ltd (Israel)
*   [https://www.minutemedia.com/policies/privacy-policy](https://www.minutemedia.com/policies/privacy-policy)

*   Sharethrough by Sharethrough Inc (Canada)
*   [https://www.sharethrough.com/privacy-center/consumer-privacy-notice](https://www.sharethrough.com/privacy-center/consumer-privacy-notice)

*   Vidazoo by Vidazoo Ltd. (Israel)
*   [https://vidazoo.gitbook.io/vidazoo-legal/privacy-policy](https://vidazoo.gitbook.io/vidazoo-legal/privacy-policy)

*   Media.net by Media.net Advertising FZ-LLC (UAE)
*   [https://www.media.net/privacy-policy/](https://www.media.net/privacy-policy/)

*   InMobi by InMobi Technology Services Pte. Ltd (Singapore)
*   [https://advertising.inmobi.com/privacy-policy](https://advertising.inmobi.com/privacy-policy)

*   Ogury by Ogury Ltd (UK)
*   [https://ogury.com/ogury-website-and-customer-privacy-and-cookie-notice/](https://ogury.com/ogury-website-and-customer-privacy-and-cookie-notice/)

*   Nexxen by Nexxen Group LLC (US)
*   [https://nexxen.com/privacy-policy/](https://nexxen.com/privacy-policy/)

*   Blis by Blis Corp Limited (UK)
*   [https://blis.com/blis-privacy-policy-for-online-advertising-and-related-uses/](https://blis.com/blis-privacy-policy-for-online-advertising-and-related-uses/)

*   Start.io by Start.io Inc (US)
*   [https://www.start.io/policy/privacy-policy/](https://www.start.io/policy/privacy-policy/)

*   OMS by Online Media Solutions Ltd (Israel)
*   [https://onlinemediasolutions.com/privacy-policy/](https://onlinemediasolutions.com/privacy-policy/)

*   Nativo by Nativo, Inc (US)
*   [https://www.nativo.com/legal/interest-based-ads](https://www.nativo.com/legal/interest-based-ads)

*   Primis by M.D. PRIMIS TECHNOLOGIES LTD (Israel)
*   [https://www.primis.tech/primis-video-platform-privacy-policy](https://www.primis.tech/primis-video-platform-privacy-policy)

*   Open Web Technologies by Open Web Technologies Ltd (Israel)
*   [https://www.openweb.com/legal-and-privacy/privacy/](https://www.openweb.com/legal-and-privacy/privacy/)

*   Venatus by Venatus Media Limited (England)
*   [https://www.venatus.com/privacy-policy](https://www.venatus.com/privacy-policy)

*   Equativ by Equativ SA (France)
*   [https://privacy.equativ.com/](https://privacy.equativ.com/)

More Information

Please visit our [Cookie Policy](https://sudoku.com/page/cookies-ca/ "Cookie Policy")to learn more about the cookies we use on our Website.

Save

 Accept all and Continue 

Ad

×
