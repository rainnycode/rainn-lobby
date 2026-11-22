import asyncio
from playwright.async_api import async_playwright
SRC="../escondite/escondite.html"
OUT="./"
body=open(SRC).read()
html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'+body+'</body></html>'
three=open("node_modules/three/build/three.min.js").read()
async def run(name, vp, touch):
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        ctx=await b.new_context(viewport=vp, has_touch=touch, is_mobile=touch, device_scale_factor=1)
        pg=await ctx.new_page()
        errs=[]
        pg.on("console", lambda m: errs.append(m.type+": "+m.text) if m.type in ("error","warning") else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERR "+str(e)))
        async def route(r):
            u=r.request.url
            if "examples/js/" in u:
                path="node_modules/three/examples/js/"+u.split("examples/js/")[1]
                await r.fulfill(body=open(path).read(), content_type="application/javascript")
            elif "three" in u: await r.fulfill(body=three, content_type="application/javascript")
            elif u.startswith("http://x/"): await r.fulfill(body=html, content_type="text/html")
            else: await r.abort()
        await pg.route("**/*", route)
        await pg.goto("http://x/")
        await pg.wait_for_timeout(2500)
        await pg.evaluate("document.getElementById('b-spin').click()")
        for k in range(5): await pg.keyboard.press("ArrowLeft")

        await pg.wait_for_timeout(800)
        await pg.screenshot(path=OUT+name+"-radio.png")
        for k in range(3): await pg.keyboard.press("ArrowLeft")
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=OUT+name+"-radio2.png")
        print(name, errs[:6]); await b.close(); return
        if not touch:
            await pg.mouse.move(vp["width"]*0.3, vp["height"]*0.5)
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=OUT+name+"-hover.png")
        await pg.evaluate("document.querySelectorAll('#menu button')[6].click()")
        await pg.wait_for_timeout(1800)
        await pg.screenshot(path=OUT+name+"-open.png")
        print(name, errs[:10])
        await b.close()
async def main():
    await run("desk",{"width":1280,"height":760},False)
    await run("phone",{"width":390,"height":844},True)
asyncio.run(main())
