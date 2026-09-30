// Modellre szabott bérlési tartalom (SEO-szöveg, műszaki adatok változatonként, sajtófotók).
// Kulcs: a Choice-modell kulcsa (márka + modell, pl. 'BMW X1', 'VW Tiguan', 'Audi A6 Avant').
// Minden mező opcionális — ami hiányzik, azt a rentalPage.ts az élő Choice-adatból pótolja.
// A számokat (ár, km, futamidő, kaució, darabszám) SOHA ne írd ide kézzel: azok a napi szinkronból jönnek.
import type { RentalContent } from './rentalPage';

export const CONTENT: Record<string, RentalContent> = {
};
