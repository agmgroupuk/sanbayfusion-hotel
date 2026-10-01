import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { encryptSecret, decryptSecret, totp } from "./security";
import { addressSchema, passwordSchema, profileSchema } from "./types";
afterEach(()=>vi.unstubAllEnvs());
describe("account validation and secret protection",()=>{
 it("encrypts enrollment secrets with randomized authenticated encryption tied to the account",()=>{vi.stubEnv("ACCOUNT_SECURITY_KEY","ab".repeat(32));const first=encryptSecret("TOPSECRETBASE32","account-a");const second=encryptSecret("TOPSECRETBASE32","account-a");expect(first).not.toBe(second);expect(first).not.toContain("TOPSECRETBASE32");expect(decryptSecret(first,"account-a")).toBe("TOPSECRETBASE32");expect(()=>decryptSecret(first,"account-b")).toThrow();const parts=first.split(".");parts[2]="bad";expect(()=>decryptSecret(parts.join("."),"account-a")).toThrow();});
 it("fails closed without a dedicated encryption key",()=>{vi.stubEnv("ACCOUNT_SECURITY_KEY","");expect(()=>encryptSecret("secret","account")).toThrow("unavailable");});
 it("uses real interoperable TOTP verification",()=>{const otp=totp("JBSWY3DPEHPK3PXP");const token=otp.generate({timestamp:59000});expect(otp.validate({token,timestamp:59000,window:0})).toBe(0);expect(otp.validate({token,timestamp:120000,window:0})).toBeNull();expect(otp.toString()).toContain("otpauth://totp/");});
 it("validates personal details and strong passwords",()=>{expect(profileSchema.safeParse({fullName:"A",displayName:"",phone:"bad"}).success).toBe(false);expect(passwordSchema.safeParse("weak").success).toBe(false);expect(passwordSchema.safeParse("LongEnoughPassword123").success).toBe(true);});
 it("requires real countries and complete Thailand service addresses",()=>{const value={kind:"delivery",details:{name:"Test Member",phone:"+66812345678",country:"TH",line1:"123 Test Road",subdistrict:"Lumphini",district:"Pathum Wan",province:"Bangkok",postalCode:"10330"}};expect(addressSchema.safeParse(value).success).toBe(true);expect(addressSchema.safeParse({...value,details:{...value.details,country:"US"}}).success).toBe(false);expect(addressSchema.safeParse({...value,kind:"billing",details:{...value.details,country:"XX",city:"Test"}}).success).toBe(false);});
});
