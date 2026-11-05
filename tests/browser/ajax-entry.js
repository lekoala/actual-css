// Test bundle for ajax.test.js: the three form enhancers, composed.
// ajax registers before validation on purpose: the transport must still see
// validation's verdict, whatever order the enhancers start in.
import "../../src/js/ajax.js";
import "../../src/js/validation.js";
import { FormDirty } from "../../src/js/dirty.js";

window.FormDirty = FormDirty;
