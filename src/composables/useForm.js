import {reactive} from 'vue'

/**
 * Minimal form state: values, one error message per field and a resolver that validates all values at once.
 *
 * @param {object} initialValues
 * @param {(values: object) => Record<string, string>} resolver returns a message per invalid field
 *
 * Fields are validated on blur (`blur(name)`) and again on every change once they show an error (`input(name)`),
 * the whole form on submit.
 */
export function useForm({initialValues, resolver}) {
    const values = reactive(structuredClone(initialValues));
    const errors = reactive({});

    function setError(name, message) {
        if (message) errors[name] = message;
        else delete errors[name];
    }

    function validateField(name) {
        setError(name, resolver(values)[name]);
    }

    /** @returns {boolean} whether all values are valid */
    function validate() {
        const found = resolver(values);
        Object.keys(errors).forEach(name => delete errors[name]);
        Object.assign(errors, found);
        return Object.keys(found).length === 0;
    }

    const blur = validateField;

    function input(name) {
        if (errors[name]) validateField(name);
    }

    /** wraps a submit handler: it only runs when the form is valid */
    function handleSubmit(onValid) {
        return (event) => {
            event?.preventDefault?.();
            if (validate()) return onValid(values);
        };
    }

    return {values, errors, blur, input, validate, validateField, handleSubmit};
}
