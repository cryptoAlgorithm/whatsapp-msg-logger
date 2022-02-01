/**
 * For some reason WA MD has a :<number> appended
 * to the end of user IDs, which changes every new login
 * and messes up a lot of assumptions
 * @param id
 */
export default function (id: string) {
    // For now just use a regex to get rid of it
    return id.replace(/:[0-9]+/, '');
}