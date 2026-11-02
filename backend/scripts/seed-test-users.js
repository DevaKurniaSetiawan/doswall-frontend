import { close } from '../src/db.js';
import { createMockUsers } from '../src/services/devServices.js';

try {
   const result = await createMockUsers();
   if (!result.success) {
      throw new Error(result.message);
   }
   console.log(result.message);
} catch (error) {
   console.error('Could not create test users:', error);
   process.exitCode = 1;
} finally {
   await close();
}
