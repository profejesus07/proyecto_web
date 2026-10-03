/**
 * Interruptores de funciones.
 * La tienda se puede explorar, pero las compras se abren solo cuando los objetos que se venden
 * (poderes y cosméticos) ya tienen efecto en el juego. Se activa con NEXT_PUBLIC_SHOP_OPEN=1.
 * Las ayudas que ya funcionan (Pista y 50/50, ver lib/game/aids.ts) se venden siempre.
 */
export const SHOP_OPEN = process.env.NEXT_PUBLIC_SHOP_OPEN === "1";
